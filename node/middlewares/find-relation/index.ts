import { json } from 'co-body'

import {
  fetchAllDocuments,
  IOrderRelationDoc,
} from '../../helpers/fetch-all-documents'

/**
 * Find relation middleware
 * Finds relationship by orderId or orderFormId using MasterData client
 */
export async function findOrderRelation(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { masterdata },
    vtex: { logger },
  } = ctx

  const body = (await json(ctx.req)) as {
    orderId?: string
    orderFormId?: string
  }

  logger.info({
    message: 'FIND_RELATION_START',
    orderId: body.orderId,
    orderFormId: body.orderFormId,
  })

  try {
    const allDocuments = await fetchAllDocuments<IOrderRelationDoc>(
      masterdata,
      'OC',
      ['orderId', 'orderFormId', 'id']
    )

    const entry = allDocuments.find(
      (doc) =>
        doc.orderId === body.orderId || doc.orderFormId === body.orderFormId
    )

    if (!entry) {
      logger.info({
        message: 'FIND_RELATION_NOT_FOUND',
        orderId: body.orderId,
        orderFormId: body.orderFormId,
      })

      ctx.status = 404
      ctx.body = { error: 'Entry not found' }

      await next()

      return
    }

    logger.info({
      message: 'FIND_RELATION_SUCCESS',
      entry,
    })

    ctx.body = entry
    ctx.status = 200
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'FIND_RELATION_ERROR',
      error: err.message,
    })

    ctx.status = 500
    ctx.body = { error: err.message }
  }

  await next()
}
