/**
 * CNPJ lookup middleware
 * Fetches company data from ReceitaWS API using the ReceitaWsClient
 */
export async function lookupCnpj(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { receitaWs },
    vtex: {
      route: { params },
      settings,
      logger,
    },
  } = ctx

  const { cnpj } = params as { cnpj: string }

  logger.info({
    message: 'CNPJ_LOOKUP_START',
    cnpj,
  })

  try {
    const companyInfo = await receitaWs.lookupByCnpj(
      cnpj,
      settings.receitaWsToken ?? ''
    )

    logger.info({
      message: 'CNPJ_LOOKUP_SUCCESS',
      cnpj,
      companyName: companyInfo.nome,
    })

    ctx.body = companyInfo
    ctx.status = 200
  } catch (error) {
    const err = error as Error & { response?: { status: number; data: unknown } }

    logger.error({
      message: 'CNPJ_LOOKUP_ERROR',
      cnpj,
      error: err.message,
    })

    ctx.status = err.response?.status ?? 500
    ctx.body = err.response?.data ?? { error: err.message }
  }

  await next()
}
