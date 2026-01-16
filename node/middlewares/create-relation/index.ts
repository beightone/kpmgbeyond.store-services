import { json } from 'co-body'

import {
  fetchAllDocuments,
  IOrderRelationDoc,
} from '../../helpers/fetch-all-documents'

/**
 * Create relation middleware
 * Creates relationship between orderId and orderFormId using MasterData and OMS clients
 */
export async function createOrderRelation(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { masterdata, vtexOms },
    vtex: { settings, logger },
  } = ctx

  const body = (await json(ctx.req)) as { orderId: string }

  logger.info({
    message: 'CREATE_RELATION_START',
    orderId: body.orderId,
  })

  try {
    const allDocuments = await fetchAllDocuments<IOrderRelationDoc>(
      masterdata,
      'OC',
      ['orderId', 'orderFormId', 'id']
    )

    // Get order data using VtexOmsClient
    const orderData = await vtexOms.getOrder(
      body.orderId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )

    const selectedEntry = allDocuments.find(
      (doc) => doc.orderFormId === orderData.orderFormId
    )

    if (!selectedEntry) {
      logger.warn({
        message: 'CREATE_RELATION_NOT_FOUND',
        orderFormId: orderData.orderFormId,
      })

      ctx.status = 404
      ctx.body = { error: 'Entry not found' }

      await next()

      return
    }

    if (selectedEntry.orderId) {
      logger.info({
        message: 'CREATE_RELATION_ALREADY_EXISTS',
        entry: selectedEntry,
      })

      ctx.status = 400
      ctx.body = { error: 'orderId already exists', entry: selectedEntry }

      await next()

      return
    }

    logger.info({
      message: 'CREATE_RELATION_SAVING',
      documentId: selectedEntry.id,
      orderId: body.orderId,
    })

    const response = await masterdata.updatePartialDocument({
      dataEntity: 'OC',
      id: selectedEntry.id,
      fields: {
        orderId: body.orderId,
      },
    })

    logger.info({
      message: 'CREATE_RELATION_SUCCESS',
      response,
    })

    ctx.status = 200
    ctx.body = { status: 'OK', documentId: selectedEntry.id }
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'CREATE_RELATION_ERROR',
      error: err.message,
    })

    ctx.status = 500
    ctx.body = { error: err.message }
  }

  await next()
}
