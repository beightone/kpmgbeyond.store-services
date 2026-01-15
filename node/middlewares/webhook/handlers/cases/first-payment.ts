/**
 * Order data structure for first payment
 */
interface OrderData {
  orderId: string
  orderFormId: string
  value: number
}

/**
 * Handler for first payment scenario
 * Registers the initial payment in KPMG system
 *
 * @param ctx - Status change context
 * @param orderData - Order data from OMS
 * @param accessToken - B2C access token
 * @param trackerId - Tracking ID for logging
 */
export async function handleFirstPayment(
  ctx: StatusChangeContext,
  orderData: OrderData,
  accessToken: string,
  trackerId: string
): Promise<void> {
  const {
    body,
    clients: { kpmg, masterdata },
    vtex: { logger },
  } = ctx

  logger.info({
    message: 'WEBHOOK_FIRST_PAYMENT_START',
    orderId: body.orderId,
    orderFormId: orderData.orderFormId,
    value: orderData.value / 100,
    currentChangeDate: body.currentChangeDate,
    trackerId,
  })

  try {
    logger.info({
      message: 'WEBHOOK_FIRST_PAYMENT_CALLING_API',
      orderId: body.orderId,
      orderFormId: orderData.orderFormId,
      paymentType: '1',
      value: orderData.value / 100,
      trackerId,
    })

    const response = await kpmg.registerPayment(
      {
        body: {
          Tipo: '1',
          OrderFormId: orderData.orderFormId,
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
      message: 'WEBHOOK_FIRST_PAYMENT_API_SUCCESS',
      orderId: body.orderId,
      orderFormId: orderData.orderFormId,
      response,
      trackerId,
    })
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'WEBHOOK_FIRST_PAYMENT_API_ERROR',
      orderId: body.orderId,
      orderFormId: orderData.orderFormId,
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
      logger.info({
        message: 'WEBHOOK_FIRST_PAYMENT_SAVING_ERROR_LOG',
        orderId: body.orderId,
        errorObject: errorLog,
        trackerId,
      })

      const saveResult = await masterdata.createDocument({
        dataEntity: 'FL',
        fields: {
          momento: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          funcionalidade: 'Primeira compra',
          erro: JSON.stringify(errorLog),
        },
      })

      logger.info({
        message: 'WEBHOOK_FIRST_PAYMENT_ERROR_SAVED',
        orderId: body.orderId,
        saveResult,
        trackerId,
      })
    } catch (saveError) {
      const saveErr = saveError as Error

      logger.error({
        message: 'WEBHOOK_FIRST_PAYMENT_SAVE_ERROR_FAILED',
        orderId: body.orderId,
        originalError: err.message,
        saveError: saveErr.message,
        trackerId,
      })
    }

    throw error
  }
}
