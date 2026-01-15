import { getMdDocByOrderId } from '../../../../helpers/get-md-doc-by-order-id'

/**
 * Order item structure
 */
interface OrderItem {
  id: string
  refId: string
  name: string
  price: number
  quantity: number
}

/**
 * Order data structure for recurrency payment
 */
interface OrderData {
  orderId: string
  orderFormId: string
  value: number
  items: OrderItem[]
}

/**
 * Subscription item structure
 */
interface SubscriptionItem {
  originalOrderId?: string
  skuId: string
  quantity: number
}

/**
 * Subscription data structure
 */
interface SubscriptionData {
  id: string
  plan: {
    id: string
  }
  items: SubscriptionItem[]
  nextPurchaseDate: string
}

/**
 * Plan upgrade data structure
 */
interface PlanUpgradeData {
  userId: string
  upgrade: string
  basic: string
}

/**
 * Handler for recurrency payment scenario
 * Processes subscription renewal payments
 *
 * @param ctx - Status change context
 * @param subscriptionId - Subscription group ID
 * @param orderData - Order data from OMS
 * @param accessToken - B2C access token
 * @param trackerId - Tracking ID for logging
 */
export async function handleRecurrencyPayment(
  ctx: StatusChangeContext,
  subscriptionId: string,
  orderData: OrderData,
  accessToken: string,
  trackerId: string
): Promise<void> {
  const {
    body,
    clients: { subscriptions, masterdata, kpmg },
    vtex: { logger, settings },
  } = ctx

  logger.info({
    message: 'WEBHOOK_RECURRENCY_PAYMENT_START',
    orderId: body.orderId,
    subscriptionId,
    trackerId,
  })

  try {
    // Get subscription details
    const subscription = (await subscriptions.getById(
      subscriptionId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )) as unknown as SubscriptionData

    logger.info({
      message: 'WEBHOOK_RECURRENCY_SUBSCRIPTION_FETCHED',
      orderId: body.orderId,
      subscriptionId,
      planId: subscription.plan.id,
      trackerId,
    })

    // Find original order ID from subscription items
    const originalOrderId = subscription.items.find(
      (item) => item.originalOrderId
    )?.originalOrderId

    if (!originalOrderId) {
      logger.warn({
        message: 'WEBHOOK_RECURRENCY_NO_ORIGINAL_ORDER',
        orderId: body.orderId,
        subscriptionId,
        trackerId,
      })

      return
    }

    // Get original order document from MasterData
    const mdDoc = await getMdDocByOrderId(ctx, originalOrderId, 'OC')

    if (!mdDoc) {
      logger.warn({
        message: 'WEBHOOK_RECURRENCY_NO_MD_DOC',
        orderId: body.orderId,
        originalOrderId,
        trackerId,
      })

      return
    }

    const { orderFormId: originalOrderFormId, email: userEmail } = mdDoc

    logger.info({
      message: 'WEBHOOK_RECURRENCY_MD_DOC_FOUND',
      orderId: body.orderId,
      originalOrderFormId,
      userEmail,
      trackerId,
    })

    // Get upgrade plan data
    const upgradePlan = (await masterdata.searchDocuments({
      dataEntity: 'PU',
      fields: ['basic', 'upgrade', 'userId'],
      where: `basic=${subscription.plan.id} OR upgrade=${subscription.plan.id}`,
      pagination: {
        page: 1,
        pageSize: 1000,
      },
    })) as PlanUpgradeData[]

    logger.info({
      message: 'WEBHOOK_RECURRENCY_UPGRADE_PLAN_FETCHED',
      orderId: body.orderId,
      upgradePlanCount: upgradePlan.length,
      trackerId,
    })

    const [plan] = upgradePlan

    // Calculate quantities
    const getQuantity = (): number => {
      const subscribedSkusWithoutUser = orderData.items.filter(
        (item) => item.id !== plan?.userId
      )

      return subscribedSkusWithoutUser[0]?.quantity ?? 0
    }

    const getUserQuantity = (): number => {
      const user = orderData.items.filter((item) => item.id === plan?.userId)

      return user[0]?.quantity ?? 0
    }

    // Get items without user
    const orderItemsWithoutUser = orderData.items.filter(
      (item) => item.id !== plan?.userId
    )

    const itensContratadosIds = orderItemsWithoutUser.map((item) => item.refId)

    const subItensContratados = orderItemsWithoutUser.reduce(
      (prev, sku) => ({
        ...prev,
        [sku.id]: {
          name: sku.name,
          refId: sku.refId,
          price: sku.price,
          skuId: sku.id,
        },
      }),
      {} as Record<string, { name: string; refId: string; price: number; skuId: string }>
    )

    // Build contract edit body (for future use)
    const editarContratoBody = {
      CicloTipoId: '1',
      ValorTotal: orderData.value / 100,
      Vigencia: new Date(subscription.nextPurchaseDate),
      OrderFormId: originalOrderFormId,
      PlanoContratado: subscription.plan.id.split('.').pop(),
      SubitensContratados: subItensContratados,
      Configuracoes: {
        QuantidadeMaximaAvaliacoes: getQuantity(),
        QuantidadeMaximaUsuariosAtivos: getUserQuantity(),
        ItensContratadosIds: JSON.stringify(itensContratadosIds),
        userId: plan?.userId,
        Usuarios: userEmail,
      },
    }

    logger.info({
      message: 'WEBHOOK_RECURRENCY_CONTRACT_BODY_BUILT',
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

    // Register payment
    const response = await kpmg.registerPayment(
      {
        body: {
          Tipo: '1',
          OrderFormId: originalOrderFormId,
          NumeroPedido: body.orderId,
          Valor: orderData.value / 100,
          Data: body.currentChangeDate,
          Mensagem: null,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
      logger,
      trackerId
    )

    logger.info({
      message: 'WEBHOOK_RECURRENCY_PAYMENT_SUCCESS',
      orderId: body.orderId,
      response,
      trackerId,
    })
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'WEBHOOK_RECURRENCY_PAYMENT_ERROR',
      orderId: body.orderId,
      subscriptionId,
      error: err.message,
      stack: err.stack,
      trackerId,
    })

    // Save error log to MasterData
    const errorLog = {
      NumeroPedido: body.orderId,
      Valor: (orderData.value / 100).toString(),
      erro: err.message,
    }

    try {
      await masterdata.createDocument({
        dataEntity: 'FL',
        fields: {
          momento: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          funcionalidade: 'Recorrência',
          erro: JSON.stringify(errorLog),
        },
      })
    } catch (saveError) {
      const saveErr = saveError as Error

      logger.error({
        message: 'WEBHOOK_RECURRENCY_SAVE_ERROR_FAILED',
        orderId: body.orderId,
        saveError: saveErr.message,
        trackerId,
      })
    }

    throw error
  }
}
