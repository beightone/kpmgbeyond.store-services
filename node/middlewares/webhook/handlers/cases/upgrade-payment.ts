import { throttleAsync } from '../../../../utils/throttle'

/**
 * Item to add to subscription
 */
interface ItemToAdd {
  skuId: string
}

/**
 * User data for upgrade
 */
interface UserData {
  id: string
  quantity: number
}

/**
 * Subscription item structure
 */
interface SubscriptionItem {
  id: string
  skuId: string
  quantity: number
}

/**
 * Handler for upgrade payment scenario
 * Updates subscription items and quantities
 *
 * @param ctx - Status change context
 * @param upgradeCustomData - Custom data from upgrade plan
 * @param trackerId - Tracking ID for logging
 */
export async function handleUpgradePayment(
  ctx: StatusChangeContext,
  upgradeCustomData: Record<string, string>,
  trackerId: string
): Promise<void> {
  const {
    body,
    clients: { subscriptions, masterdata },
    vtex: { logger, settings },
  } = ctx

  logger.info({
    message: 'WEBHOOK_UPGRADE_PAYMENT_START',
    orderId: body.orderId,
    upgradeCustomData,
    trackerId,
  })

  try {
    const {
      quantity: quantityStr,
      subscriptionId,
      originalOrderFormId,
      planId,
    } = upgradeCustomData

    const quantity = parseInt(quantityStr, 10)
    const itemsToAdd: ItemToAdd[] = JSON.parse(
      upgradeCustomData.itemsToAdd || '[]'
    )
    const user: UserData = JSON.parse(upgradeCustomData.user || '{}')
    const items: string[] = JSON.parse(upgradeCustomData.items || '[]')

    logger.info({
      message: 'WEBHOOK_UPGRADE_PARSED_DATA',
      orderId: body.orderId,
      subscriptionId,
      quantity,
      itemsToAddCount: itemsToAdd.length,
      userId: user.id,
      userQuantity: user.quantity,
      trackerId,
    })

    // Add new items to subscription
    if (itemsToAdd.length > 0) {
      await addItemsToSubscription(
        ctx,
        subscriptionId,
        itemsToAdd,
        quantity,
        trackerId
      )
    }

    // Get current subscription
    const subscription = await subscriptions.getById(
      subscriptionId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )

    // Update existing items quantities
    await updateSubscriptionItems(
      ctx,
      subscriptionId,
      (subscription as unknown as { items: SubscriptionItem[] }).items,
      quantity,
      user,
      trackerId
    )

    // Get client data from MasterData
    const dadosClienteMd = (await masterdata.searchDocuments({
      dataEntity: 'OC',
      fields: ['email'],
      where: `subscriptionId=${subscriptionId}`,
      pagination: {
        page: 1,
        pageSize: 1000,
      },
    })) as Array<{ email: string }>

    logger.info({
      message: 'WEBHOOK_UPGRADE_CLIENT_DATA',
      orderId: body.orderId,
      subscriptionId,
      clientEmail: dadosClienteMd[0]?.email,
      trackerId,
    })

    // Build contract edit body (for future use)
    const editarContratoBody = {
      CicloTipoId: '1',
      ValorTotal: 0, // TODO: Calculate from simulation
      Vigencia: new Date(
        (subscription as unknown as { nextPurchaseDate: string })
          .nextPurchaseDate
      ),
      OrderFormId: originalOrderFormId,
      PlanoContratado: planId?.split('.').pop(),
      SubitensContratados: JSON.stringify(items),
      Configuracoes: {
        QuantidadeMaximaAvaliacoes: quantity,
        QuantidadeMaximaUsuariosAtivos: user.quantity,
        ItensContratadosIds: JSON.stringify(items),
        userId: user.id,
        Usuarios: dadosClienteMd[0]?.email,
      },
    }

    logger.info({
      message: 'WEBHOOK_UPGRADE_CONTRACT_BODY_BUILT',
      orderId: body.orderId,
      editarContratoBody,
      trackerId,
    })

    // TODO: Uncomment when editarContrato endpoint is ready
    // await kpmg.editContract({
    //   body: editarContratoBody,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // })

    // TODO: Delete vbase file when ready
    // await vbase.deleteFile('upgradeStatus', subscriptionId)

    logger.info({
      message: 'WEBHOOK_UPGRADE_PAYMENT_SUCCESS',
      orderId: body.orderId,
      subscriptionId,
      trackerId,
    })
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'WEBHOOK_UPGRADE_PAYMENT_ERROR',
      orderId: body.orderId,
      error: err.message,
      stack: err.stack,
      trackerId,
    })

    // Save error log to MasterData
    const errorLog = {
      NumeroPedido: body.orderId,
      erro: err.message,
    }

    try {
      await masterdata.createDocument({
        dataEntity: 'FL',
        fields: {
          momento: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          funcionalidade: 'Upgrade',
          erro: JSON.stringify(errorLog),
        },
      })
    } catch (saveError) {
      const saveErr = saveError as Error

      logger.error({
        message: 'WEBHOOK_UPGRADE_SAVE_ERROR_FAILED',
        orderId: body.orderId,
        saveError: saveErr.message,
        trackerId,
      })
    }

    throw error
  }
}

/**
 * Add items to subscription with throttling
 */
async function addItemsToSubscription(
  ctx: StatusChangeContext,
  subscriptionId: string,
  itemsToAdd: ItemToAdd[],
  quantity: number,
  trackerId: string
): Promise<void> {
  const {
    clients: { subscriptions },
    vtex: { logger, settings },
  } = ctx

  logger.info({
    message: 'WEBHOOK_UPGRADE_ADDING_ITEMS',
    subscriptionId,
    itemsCount: itemsToAdd.length,
    trackerId,
  })

  // Split items into batches of 40
  const batchSize = 40
  const batches: ItemToAdd[][] = []

  for (let i = 0; i < itemsToAdd.length; i += batchSize) {
    batches.push(itemsToAdd.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    const throttledAdd = await throttleAsync(
      async (item: ItemToAdd) => {
        await subscriptions.addItem(
          subscriptionId,
          { skuId: item.skuId, quantity },
          settings.appKey ?? '',
          settings.appToken ?? ''
        )

        logger.info({
          message: 'WEBHOOK_UPGRADE_ITEM_ADDED',
          subscriptionId,
          skuId: item.skuId,
          trackerId,
        })
      },
      1000
    )

    await Promise.all(batch.map((item) => throttledAdd(item)))
  }
}

/**
 * Update subscription items quantities with throttling
 */
async function updateSubscriptionItems(
  ctx: StatusChangeContext,
  subscriptionId: string,
  items: SubscriptionItem[],
  quantity: number,
  user: UserData,
  trackerId: string
): Promise<void> {
  const {
    clients: { subscriptions },
    vtex: { logger, settings },
  } = ctx

  logger.info({
    message: 'WEBHOOK_UPGRADE_UPDATING_ITEMS',
    subscriptionId,
    itemsCount: items.length,
    trackerId,
  })

  // Find user subscription item
  const userSubscription = items.find((item) => item.skuId === user.id)

  // Split items into batches of 47
  const batchSize = 47
  const batches: SubscriptionItem[][] = []

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    const throttledUpdate = await throttleAsync(
      async (item: SubscriptionItem) => {
        // Skip if quantity already matches
        if (item.quantity === quantity && item.skuId !== user.id) {
          return
        }

        // Skip if user quantity already matches
        if (
          user.quantity === userSubscription?.quantity &&
          item.skuId === user.id
        ) {
          return
        }

        const newQuantity =
          item.skuId === user.id ? user.quantity : quantity

        await subscriptions.updateItem(
          subscriptionId,
          item.id,
          { quantity: newQuantity },
          settings.appKey ?? '',
          settings.appToken ?? ''
        )

        logger.info({
          message: 'WEBHOOK_UPGRADE_ITEM_UPDATED',
          subscriptionId,
          itemId: item.id,
          skuId: item.skuId,
          newQuantity,
          trackerId,
        })
      },
      1000
    )

    await Promise.all(batch.map((item) => throttledUpdate(item)))
  }
}
