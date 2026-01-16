type NextMiddleware = () => Promise<unknown>

/**
 * Middleware wrapper that injects app settings into the context
 * Fetches app settings from VTEX Apps client and merges with existing settings
 *
 * @param ctx - VTEX Context
 * @param next - Next middleware function
 */
export async function withAppSettings(
  ctx: Context,
  next: NextMiddleware
): Promise<void> {
  const {
    clients: { apps: appsClient },
  } = ctx

  const appSettings = await appsClient.getAppSettings(
    process.env.VTEX_APP_ID as string
  )

  ctx.vtex.settings = {
    ...ctx.vtex.settings,
    ...appSettings,
  }

  await next()
}
