/**
 * Status check middleware
 * Returns the current application version status
 */
export async function status(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  ctx.body = { isUpdated: process.env.VTEX_APP_VERSION ?? 'unknown' }
  ctx.status = 200

  await next()
}
