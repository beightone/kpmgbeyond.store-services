/**
 * Handler for canceled order status
 * Sends notification to KPMG system when an order is canceled
 */
export async function handleCanceled(ctx: StatusChangeContext): Promise<void> {
  const {
    body,
    clients: { vtexOms, b2cAuth, kpmg },
    vtex: { logger, settings },
  } = ctx

  const trackerId = `canceled-${body.orderId}-${Date.now()}`

  logger.info({
    message: 'WEBHOOK_CANCELED_START',
    orderId: body.orderId,
    currentChangeDate: body.currentChangeDate,
    trackerId,
  })

  try {
    // Get order data from OMS
    const orderData = await vtexOms.getOrder(
      body.orderId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )

    logger.info({
      message: 'WEBHOOK_CANCELED_ORDER_FETCHED',
      orderId: body.orderId,
      orderFormId: orderData.orderFormId,
      trackerId,
    })

    // Get B2C authentication token
    const tokenResponse = await b2cAuth.getToken(
      settings.b2cUsername ?? '',
      settings.b2cPassword ?? ''
    )

    logger.info({
      message: 'WEBHOOK_CANCELED_TOKEN_OBTAINED',
      orderId: body.orderId,
      trackerId,
    })

    // Send cancellation notification to KPMG
    const response = await kpmg.sendNotification({
      body: {
        NotificacaoTipoId: '1',
        OrderFormId: orderData.orderFormId,
        Data: body.currentChangeDate,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    })

    logger.info({
      message: 'WEBHOOK_CANCELED_NOTIFICATION_SENT',
      orderId: body.orderId,
      orderFormId: orderData.orderFormId,
      response,
      trackerId,
    })
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'WEBHOOK_CANCELED_ERROR',
      orderId: body.orderId,
      error: err.message,
      stack: err.stack,
      trackerId,
    })

    throw error
  }
}
