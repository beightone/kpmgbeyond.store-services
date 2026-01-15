import { json } from 'co-body'
import Crypto from 'crypto-js'

/**
 * Product configuration structure from encrypted payload
 */
interface IProductConfiguration {
  ProdutoId: string
  PlanId: string
  ValorTotal: number
  Configuracoes: {
    QuantidadeMaximaAvaliacoes?: number
    QuantidadeMaximaUsuariosAtivos?: number
    userId?: string
    Usuarios?: Array<{
      Nome: string
      Email: string
      Telefone: string
    }>
  }
  refToSkuObj?: Record<string, { name: string }>
}

/**
 * Contact information
 */
interface IContact {
  name: string
  surname: string
  email: string
  phone: string
  cpf: string
}

/**
 * Business information
 */
interface IBusiness {
  cnpj: string
  commercialName: string
  fantasyName: string
  previousName?: string
  controlledByOther?: boolean
  lineOfBusiness: string
}

/**
 * Address information
 */
interface IAddress {
  cep: string
  street: string
  number: string
  city: string
  state: string
}

/**
 * Order request body structure for Upright
 */
interface INewOrderUprightBody {
  orderFormId: string
  productConfigurations: string
  rdTrackingId?: string
  acceptedTerms?: string[]
  contact: IContact
  business: IBusiness
  address: IAddress
}

/**
 * Calculate expiration date (10 days from now, adjusted for timezone)
 * @returns ISO date string for validity period
 */
function calculateValidityDate(): string {
  const now = new Date()

  now.setDate(now.getDate() + 10)
  now.setHours(now.getHours() - 3)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * New order Upright middleware for Beyond products
 * Creates contract in KPMG system using B2C authentication
 */
export async function createNewOrderUpright(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { b2cAuth, kpmg },
    vtex: { logger, settings },
  } = ctx

  try {
    const body = (await json(ctx.req)) as INewOrderUprightBody

    logger.info({
      message: 'NEW_ORDER_UPRIGHT_START',
      orderFormId: body.orderFormId,
      contactEmail: body.contact?.email,
      businessCnpj: body.business?.cnpj,
    })

    const user = {
      Nome: `${body.contact.name} ${body.contact.surname}`,
      Email: body.contact.email,
      Telefone: body.contact.phone.toString(),
    }

    const decryptedConfig = Crypto.AES.decrypt(
      body.productConfigurations,
      settings.encryptionKey ?? ''
    )

    const productConfig: IProductConfiguration = JSON.parse(
      decryptedConfig.toString(Crypto.enc.Utf8)
    )

    logger.info({
      message: 'NEW_ORDER_UPRIGHT_PRODUCT_CONFIG_DECRYPTED',
      productId: productConfig.ProdutoId,
      planId: productConfig.PlanId,
      orderFormId: body.orderFormId,
    })

    productConfig.Configuracoes.Usuarios = [{ ...user }]

    const validityDate = calculateValidityDate()

    const subItemsHired = Object.values(productConfig.refToSkuObj ?? {}).map(
      (product) => product.name
    )

    const hiredPlan = (productConfig.PlanId || '').split('.').pop()

    // Remove fields that shouldn't be sent to KPMG
    const { PlanId: _, refToSkuObj: __, ...cleanConfig } = productConfig

    const contractObject = {
      CNPJ: body.business.cnpj.replace(/\D/g, ''),
      CEP: body.address.cep.replace('.', ''),
      RazaoSocial: body.business.commercialName,
      NomeFantasia: body.business.fantasyName,
      NomeAnterior: body.business.previousName ?? null,
      PertenceGrupoEmpresas: !!body.business.controlledByOther,
      Endereco: `${body.address.street} ${body.address.number}`,
      Cidade: body.address.city,
      UF: body.address.state,
      LineOfBusiness: parseInt(body.business.lineOfBusiness, 10),
      Vigencia: validityDate,
      // Using a hardcoded original order number for Upright (as in original code)
      NumeroPedidoOriginal: '8b43b8f1486a4ae2aaa1ab50c7730ae3',
      OrderFormId: body.orderFormId,
      TermosAceitos: body.acceptedTerms ?? [],
      CicloTipoId: 1,
      Contatos: [
        {
          ...user,
          CPF: body.contact.cpf,
        },
      ],
      SubitensContratados: subItemsHired,
      PlanoContratado: hiredPlan,
      RDEntidadeId: body.rdTrackingId,
      ...cleanConfig,
    }

    logger.info({
      message: 'NEW_ORDER_UPRIGHT_KPMG_OBJECT_FINAL',
      CNPJ: contractObject.CNPJ,
      OrderFormId: contractObject.OrderFormId,
      subItemsCount: contractObject.SubitensContratados?.length,
      hiredPlan: contractObject.PlanoContratado,
      orderFormId: body.orderFormId,
    })

    // Get B2C token for authentication
    const tokenResponse = await b2cAuth.getToken(
      settings.b2cUsername ?? '',
      settings.b2cPassword ?? ''
    )

    logger.info({
      message: 'NEW_ORDER_UPRIGHT_AUTH_SUCCESS',
      orderFormId: body.orderFormId,
      hasToken: !!tokenResponse.access_token,
    })

    try {
      await kpmg.createContract({
        body: contractObject,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      })

      logger.info({
        message: 'NEW_ORDER_UPRIGHT_KPMG_SUCCESS',
        orderFormId: body.orderFormId,
        CNPJ: contractObject.CNPJ,
      })
    } catch (error) {
      const err = error as Error

      logger.error({
        message: 'NEW_ORDER_UPRIGHT_KPMG_ERROR',
        orderFormId: body.orderFormId,
        error: err.message,
      })

      throw error
    }

    ctx.body = { status: 'OK', orderFormId: body.orderFormId }
    ctx.status = 200

    await next()
  } catch (error) {
    const err = error as Error

    logger.error({
      message: 'NEW_ORDER_UPRIGHT_ERROR',
      error: err.message,
    })

    ctx.body = {
      status: 'ERROR',
      message: err.message,
    }
    ctx.status = 400
  }
}
