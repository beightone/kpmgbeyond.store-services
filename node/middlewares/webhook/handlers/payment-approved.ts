import { handleFirstPayment } from './cases/first-payment'
import { handleRecurrencyPayment } from './cases/recurrency-payment'
import { handleUpgradePayment } from './cases/upgrade-payment'

/**
 * Custom data structure for upgrade plan
 */
interface UpgradeCustomData {
  id: string
  fields: Record<string, string>
}

/**
 * Order data structure (simplified for webhook)
 */
interface OrderData {
  orderId: string
  orderFormId: string
  value: number
  items: Array<{
    id: string
    refId: string
    name: string
    price: number
    quantity: number
  }>
  customData?: {
    customApps?: UpgradeCustomData[]
  }
  subscriptionData?: {
    SubscriptionGroupId?: string
  }
}

/**
 * Handler for payment-approved order status
 * Routes to appropriate sub-handler based on order type:
 * - Upgrade: When customData contains 'upgradeplan' app
 * - Recurrency: When subscriptionData contains SubscriptionGroupId
 * - First Payment: Default case for new orders
 */
export async function handlePaymentApproved(
  ctx: StatusChangeContext
): Promise<void> {
  const {
    body,
    clients: { vtexOms, b2cAuth },
    vtex: { logger, settings },
  } = ctx

  const trackerId = `payment-approved-${body.orderId}-${Date.now()}`

  logger.info({
    message: 'WEBHOOK_PAYMENT_APPROVED_START',
    orderId: body.orderId,
    currentChangeDate: body.currentChangeDate,
    trackerId,
  })

  try {
    // Get B2C authentication token
    const tokenResponse = await b2cAuth.getToken(
      settings.b2cUsername ?? '',
      settings.b2cPassword ?? ''
    )

    logger.info({
      message: 'WEBHOOK_PAYMENT_APPROVED_TOKEN_OBTAINED',
      orderId: body.orderId,
      trackerId,
    })

    // Get order data from OMS
    const orderData = (await vtexOms.getOrder(
      body.orderId,
      settings.appKey ?? '',
      settings.appToken ?? ''
    )) as unknown as OrderData

    logger.info({
      message: 'WEBHOOK_PAYMENT_APPROVED_ORDER_FETCHED',
      orderId: body.orderId,
      orderFormId: orderData.orderFormId,
      hasCustomData: !!orderData.customData,
      hasSubscriptionData: !!orderData.subscriptionData,
      trackerId,
    })

    // Check for upgrade custom data
    const upgradeCustomData = orderData.customData?.customApps?.find(
      (customApp) => customApp.id === 'upgradeplan'
    )

    // Check for subscription ID (recurrency)
    const subscriptionId = orderData.subscriptionData?.SubscriptionGroupId

    // Route to appropriate handler
    if (upgradeCustomData) {
      logger.info({
        message: 'WEBHOOK_PAYMENT_APPROVED_UPGRADE_DETECTED',
        orderId: body.orderId,
        trackerId,
      })

      await handleUpgradePayment(ctx, upgradeCustomData.fields, trackerId)

      return
    }

    if (subscriptionId) {
      logger.info({
        message: 'WEBHOOK_PAYMENT_APPROVED_RECURRENCY_DETECTED',
        orderId: body.orderId,
        subscriptionId,
        trackerId,
      })

      await handleRecurrencyPayment(
        ctx,
        subscriptionId,
        orderData,
        tokenResponse.access_token,
        trackerId
      )

      return
    }

    // Default: First payment
    logger.info({
      message: 'WEBHOOK_PAYMENT_APPROVED_FIRST_PAYMENT_DETECTED',
      orderId: body.orderId,
      trackerId,
    })

    await handleFirstPayment(
      ctx,
      orderData,
      tokenResponse.access_token,
      trackerId
    )
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'WEBHOOK_PAYMENT_APPROVED_ERROR',
      orderId: body.orderId,
      error: err.message,
      stack: err.stack,
      trackerId,
    })

    throw error
  }
}
