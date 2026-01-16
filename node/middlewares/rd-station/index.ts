import { json } from 'co-body'

import type { IConversionPayload } from '../../clients/rd-station'

/**
 * RD Station conversion event middleware
 * Sends conversion events to RD Station Marketing API using RDStationClient
 */
export async function sendRdStationConversion(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { rdStation },
    vtex: { settings, logger },
  } = ctx

  const body = (await json(ctx.req)) as IConversionPayload

  logger.info({
    message: 'RD_STATION_CONVERSION_START',
    email: body.email,
    conversionIdentifier: body.conversion_identifier,
  })

  try {
    const response = await rdStation.sendConversion(
      body,
      settings.rdStationApiKey ?? ''
    )

    logger.info({
      message: 'RD_STATION_CONVERSION_SUCCESS',
      eventUuid: response.event_uuid,
    })

    ctx.status = 200
    ctx.body = { status: 'OK', eventUuid: response.event_uuid }
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'RD_STATION_CONVERSION_ERROR',
      error: err.message,
    })

    ctx.status = 500
    ctx.body = { error: err.message }
  }

  await next()
}
