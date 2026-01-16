import { json } from 'co-body'
import Crypto from 'crypto-js'

/**
 * Request body for interested user registration
 */
interface IInterestedUserBody {
  email: string
  name: string
  cnpj: string
  productConfigurations: string
}

/**
 * Interested user registration middleware
 * Registers users interested in products using MasterData client
 */
export async function registerInterestedUser(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { masterDataContext },
    vtex: { logger, settings },
  } = ctx

  try {
    const body = (await json(ctx.req)) as IInterestedUserBody

    logger.info({
      message: 'INTERESTED_USER_START',
      email: body.email,
      cnpj: body.cnpj,
    })

    const decryptedConfig = Crypto.AES.decrypt(
      body.productConfigurations,
      settings.encryptionKey ?? ''
    )

    const productConfig = JSON.parse(
      decryptedConfig.toString(Crypto.enc.Utf8)
    ) as { ProdutoId: string }

    const response = await masterDataContext.registerInDataEntity(
      {
        email: body.email,
        product: productConfig.ProdutoId,
        clientName: body.name,
        cnpj: body.cnpj,
      },
      'IU',
      logger
    )

    logger.info({
      message: 'INTERESTED_USER_SUCCESS',
      email: body.email,
      productId: productConfig.ProdutoId,
    })

    ctx.body = { status: 'OK', data: response.data }
    ctx.status = 200
  } catch (error) {
    const err = error as Error & { name: string }

    logger.error({
      message: 'INTERESTED_USER_ERROR',
      error: err.message,
    })

    ctx.body = {
      status: err.name,
      message: err.message,
    }
    ctx.status = 400
  }

  await next()
}
