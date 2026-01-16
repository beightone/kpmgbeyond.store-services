/**
 * Health check middleware
 * Returns OK status for monitoring purposes
 */
export function health(ctx: Context, next: () => Promise<void>): Promise<void> {
  ctx.status = 200
  ctx.body = 'OK'

  return next()
}
