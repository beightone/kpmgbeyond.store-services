/**
 * Check if user has a recent free trial order (within 10 days)
 * @param documents - Array of MasterData documents with createdIn date
 * @param logger - VTEX logger instance
 * @param trackerId - Tracker ID for logging
 * @returns true if user has a recent order within 10 days
 */
export function checkFreeTrialEligibility(
  documents: Array<{ createdIn?: string }>,
  logger?: Context['vtex']['logger'],
  trackerId?: string
): boolean {
  const today = new Date()
  const tenDaysAgo = new Date()

  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
  tenDaysAgo.setHours(0, 0, 0, 0)

  logger?.info({
    message: 'CHECK_FREE_TRIAL_ELIGIBILITY',
    totalDocuments: documents?.length ?? 0,
    periodStart: tenDaysAgo.toISOString(),
    periodEnd: today.toISOString(),
    trackerId,
  })

  const hasRecentOrder = documents.some((order) => {
    const createdInDate = new Date(order.createdIn ?? '')

    createdInDate.setHours(0, 0, 0, 0)

    const isInPeriod = createdInDate >= tenDaysAgo && createdInDate <= today

    logger?.info({
      message: 'CHECK_FREE_TRIAL_ORDER',
      order,
      createdInDate: createdInDate.toISOString(),
      isInPeriod,
      trackerId,
    })

    return isInPeriod
  })

  logger?.info({
    message: 'CHECK_FREE_TRIAL_RESULT',
    hasRecentOrder,
    reason: hasRecentOrder
      ? 'Found order within last 10 days'
      : 'No orders found within last 10 days',
    trackerId,
  })

  return hasRecentOrder
}

/**
 * Check if user is registered by CNPJ middleware
 * Returns documents and free trial status using MasterData client
 */
export async function checkUserRegistration(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { masterDataContext },
    vtex: {
      route: { params },
      logger,
    },
  } = ctx

  const { cnpj, dataEntity } = params as { cnpj: string; dataEntity: string }
  const trackerId = `checkUserRegistration-${cnpj}-${Date.now()}`

  logger.info({
    message: 'CHECK_USER_REGISTRATION_START',
    cnpj,
    dataEntity,
    trackerId,
  })

  try {
    const { data, status } = await masterDataContext.isUserRegistered(
      cnpj,
      dataEntity,
      logger,
      trackerId
    )

    logger.info({
      message: 'CHECK_USER_REGISTRATION_MD_RESPONSE',
      status,
      dataCount: data?.length ?? 0,
      trackerId,
    })

    if (status !== 200) {
      logger.error({
        message: 'CHECK_USER_REGISTRATION_MD_ERROR',
        status,
        error: 'Status not 200',
        trackerId,
      })

      ctx.body = {
        error: 'Error checking user registration',
        status,
      }
      ctx.status = status ?? 500

      await next()

      return
    }

    const hasRecentOrder = checkFreeTrialEligibility(
      data ?? [],
      logger,
      trackerId
    )

    logger.info({
      message: 'CHECK_USER_REGISTRATION_RESULT',
      cnpj,
      dataEntity,
      documentsCount: data?.length ?? 0,
      hasRecentOrder,
      trackerId,
    })

    ctx.body = {
      documents: data,
      hasRecentOrder,
    }
    ctx.status = 200
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'CHECK_USER_REGISTRATION_ERROR',
      error: err.message,
      trackerId,
    })

    ctx.body = {
      error: err.message,
    }
    ctx.status = 500
  }

  await next()
}
