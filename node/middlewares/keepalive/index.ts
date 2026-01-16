import { json } from 'co-body'

/**
 * Keep-alive endpoint middleware
 * Returns the ping message for health monitoring
 */
export async function keepalive(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const body = (await json(ctx.req)) as { ping?: string }

  ctx.status = 200
  ctx.vtex.logger.info({
    message: 'KEEPALIVE_PONG',
    ping: body.ping,
  })

  await next()
}
