import { json } from 'co-body'

import { getMdDocByOrderId } from '../../helpers/get-md-doc-by-order-id'

/**
 * Cancel subscription middleware
 * Cancels a subscription using SubscriptionsClient and notifies KPMG system
 */
export async function cancelSubscription(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { subscriptions, kpmgAuth, kpmg, masterdata },
    vtex: { settings, logger },
  } = ctx

  try {
    const { subscriptionId } = (await json(ctx.req)) as {
      subscriptionId: string
    }

    logger.info({
      message: 'CANCEL_SUBSCRIPTION_START',
      subscriptionId,
    })

    // Fetch current subscription using client
    const subscriptionData = await subscriptions.getById(
      subscriptionId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )

    logger.info({
      message: 'CANCEL_SUBSCRIPTION_FETCHED',
      subscriptionId,
      planId: subscriptionData.plan?.id,
      status: subscriptionData.status,
    })

    // Cancel subscription using client
    await subscriptions.cancel(
      subscriptionId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )

    // Determine data entity based on plan
    const dataEntity =
      subscriptionData.plan.id === 'vtex.subscription.kpmg-upright-basic'
        ? 'OU'
        : 'OC'

    const originalOrderId = subscriptionData.items?.find(
      (item) => item.originalOrderId
    )?.originalOrderId

    logger.info({
      message: 'CANCEL_SUBSCRIPTION_ORIGINAL_ORDER',
      originalOrderId,
      dataEntity,
    })

    const mdDoc = await getMdDocByOrderId(ctx, originalOrderId ?? '', dataEntity)

    if (!mdDoc?.orderFormId) {
      logger.warn({
        message: 'CANCEL_SUBSCRIPTION_MD_DOC_NOT_FOUND',
        originalOrderId,
      })
    }

    // Get KPMG token using /api/Token/GetToken
    const tokenResponse = await kpmgAuth.getToken(
      settings.kpmgUsername ?? '',
      settings.kpmgPassword ?? ''
    )

    // Notify KPMG using client
    await kpmg.sendNotification({
      body: {
        NotificacaoTipoId: '1',
        OrderFormId: mdDoc?.orderFormId,
        Data: new Date().toISOString(),
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    })

    // Save cancellation record
    await masterdata.createDocument({
      dataEntity: 'CS',
      fields: {
        email: subscriptionData.customerEmail,
        subscriptionId,
      },
    })

    logger.info({
      message: 'CANCEL_SUBSCRIPTION_SUCCESS',
      subscriptionId,
    })

    ctx.status = 200
    ctx.body = { status: 'OK', subscriptionId }
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'CANCEL_SUBSCRIPTION_ERROR',
      error: err.message,
    })

    ctx.status = 500
    ctx.body = { error: err.message }
  }

  await next()
}
