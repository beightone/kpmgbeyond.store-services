import Crypto from 'crypto-js'

/**
 * Get KPMG order token middleware
 * Fetches KPMG token using /api/Token/GetToken and encrypts it for frontend use
 */
export async function getKpmgOrderToken(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { kpmgAuth },
    vtex: { settings, logger },
  } = ctx

  logger.info({
    message: 'KPMG_ORDER_TOKEN_START',
  })

  try {
    const tokenResponse = await kpmgAuth.getToken(
      settings.kpmgUsername ?? '',
      settings.kpmgPassword ?? ''
    )

    const encryptedToken = Crypto.AES.encrypt(
      tokenResponse.access_token,
      settings.encryptionKey ?? ''
    ).toString()

    logger.info({
      message: 'KPMG_ORDER_TOKEN_SUCCESS',
      tokenType: tokenResponse.token_type,
      expiresIn: tokenResponse.expires_in,
    })

    ctx.status = 200
    ctx.body = encryptedToken
  } catch (error) {
    const err = error as Error & { response?: { status: number } }

    logger.error({
      message: 'KPMG_ORDER_TOKEN_ERROR',
      error: err.message,
    })

    ctx.status = err.response?.status ?? 500
    ctx.body = {
      message: 'Error getting token',
      details: err.message,
    }
  }

  await next()
}
