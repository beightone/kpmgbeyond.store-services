import type { EventContext } from '@vtex/api'

import type { Clients } from '../../clients'
import { handlePaymentApproved } from './handlers/payment-approved'
import { handleCanceled } from './handlers/canceled'

/**
 * Event handlers map for order status changes
 */
type StatusHandler = (ctx: StatusChangeContext) => Promise<void>

const statusHandlers: Record<string, StatusHandler> = {
  'payment-approved': handlePaymentApproved,
  canceled: handleCanceled,
}

/**
 * Webhook handler for VTEX order status updates
 * Receives events from vtex.orders-broadcast and routes to appropriate handlers
 *
 * Event: order-status-updated
 * Topics: payment-approved, canceled, etc.
 */
export async function webhook(
  ctx: EventContext<Clients, State>,
  next: () => Promise<void>
): Promise<void> {
  const {
    vtex: { logger },
  } = ctx

  // Cast body to StatusChangeBody
  const body = ctx.body as unknown as StatusChangeBody

  logger.info({
    message: 'WEBHOOK_EVENT_RECEIVED',
    orderId: body.orderId,
    currentState: body.currentState,
    currentChangeDate: body.currentChangeDate,
  })

  const handler = statusHandlers[body.currentState]

  if (handler) {
    logger.info({
      message: 'WEBHOOK_HANDLER_FOUND',
      orderId: body.orderId,
      currentState: body.currentState,
    })

    try {
      // Create StatusChangeContext from EventContext
      const statusCtx = {
        ...ctx,
        body,
      } as StatusChangeContext

      await handler(statusCtx)
    } catch (error) {
      const err = error as Error

      logger.error({
        message: 'WEBHOOK_HANDLER_ERROR',
        orderId: body.orderId,
        currentState: body.currentState,
        error: err.message,
        stack: err.stack,
      })
    }
  } else {
    logger.warn({
      message: 'WEBHOOK_HANDLER_NOT_FOUND',
      orderId: body.orderId,
      currentState: body.currentState,
      availableHandlers: Object.keys(statusHandlers),
    })
  }

  await next()
}
