import { json } from 'co-body'
import Crypto from 'crypto-js'

/**
 * Request body for data entity registration
 */
interface IRegisterBody {
  email: string
  product: string
  orderFormId: string
  clientName: string
  cnpj: string
}

/**
 * Register in data entity middleware
 * Registers user data in specified MasterData entity using MasterDataContextClient
 */
export async function registerInDataEntity(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { masterDataContext },
    vtex: {
      route: { params },
      settings,
      logger,
    },
  } = ctx

  try {
    const body = (await json(ctx.req)) as IRegisterBody

    const { dataEntity } = params as { dataEntity: string }

    logger.info({
      message: 'REGISTER_IN_DATA_ENTITY_START',
      dataEntity,
      email: body.email,
    })

    const decryptedConfig = Crypto.AES.decrypt(
      body.product,
      settings.encryptionKey ?? ''
    )

    const productConfig = JSON.parse(
      decryptedConfig.toString(Crypto.enc.Utf8)
    ) as { ProdutoId: string }

    const requestBody = {
      email: body.email,
      product: productConfig.ProdutoId,
      orderFormId: body.orderFormId,
      clientName: body.clientName,
      cnpj: body.cnpj.replace(/\D/g, ''),
    }

    const response = await masterDataContext.registerInDataEntity(
      requestBody,
      dataEntity,
      logger
    )

    logger.info({
      message: 'REGISTER_IN_DATA_ENTITY_SUCCESS',
      dataEntity,
      email: body.email,
      productId: productConfig.ProdutoId,
    })

    ctx.status = 200
    ctx.body = {
      status: 'OK',
      orderFormId: body.orderFormId,
      data: response.data,
    }
  } catch (error) {
    const err = error as Error & { name: string }

    logger.error({
      message: 'REGISTER_IN_DATA_ENTITY_ERROR',
      error: err.message,
    })

    ctx.body = {
      status: err.name,
      message: err.message,
    }
    ctx.status = 500
  }

  await next()
}
