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
 * Order request body structure
 */
interface INewOrderBody {
  orderFormId: string
  productConfigurations: string
  token: string
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
 * New order middleware for Beyond products
 * Creates contract in KPMG system using KPMGClient
 */
export async function createNewOrder(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const { logger, settings } = ctx.vtex

  try {
    const body = (await json(ctx.req)) as INewOrderBody

    logger.info({
      message: 'NEW_ORDER_START',
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
      message: 'NEW_ORDER_PRODUCT_CONFIG_DECRYPTED',
      productId: productConfig.ProdutoId,
      planId: productConfig.PlanId,
      totalValue: productConfig.ValorTotal,
      orderFormId: body.orderFormId,
    })

    productConfig.Configuracoes.Usuarios = [{ ...user }]

    const validityDate = calculateValidityDate()

    const subItemsHired = Object.values(productConfig.refToSkuObj ?? {}).map(
      (product) => product.name
    )

    const hiredPlan = (productConfig.PlanId || '').split('.').pop()

    logger.info({
      message: 'NEW_ORDER_BEFORE_DATA_CLEANUP',
      subItemsHired,
      hiredPlan,
      originalPlanId: productConfig.PlanId,
      orderFormId: body.orderFormId,
    })

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
      message: 'NEW_ORDER_KPMG_OBJECT_FINAL',
      CNPJ: contractObject.CNPJ,
      OrderFormId: contractObject.OrderFormId,
      subItemsCount: contractObject.SubitensContratados?.length,
      hiredPlan: contractObject.PlanoContratado,
      totalValue: contractObject.ValorTotal,
      orderFormId: body.orderFormId,
    })

    const decryptedTokenBytes = Crypto.AES.decrypt(
      body.token,
      settings.encryptionKey ?? ''
    )

    const decryptedToken = decryptedTokenBytes.toString(Crypto.enc.Utf8)

    try {
      logger.info({
        message: 'NEW_ORDER_CALL_KPMG_CREATE_CONTRACT',
        orderFormId: body.orderFormId,
      })

      await ctx.clients.kpmg.createContract(
        {
          body: contractObject,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decryptedToken}`,
          },
        },
        logger,
        body.orderFormId
      )

      logger.info({
        message: 'NEW_ORDER_CALL_KPMG_CREATE_CONTRACT_SUCCESS',
        orderFormId: body.orderFormId,
      })
    } catch (error) {
      const err = error as Error & {
        response?: { data?: { errors?: string[] } }
      }

      logger.error({
        message: 'NEW_ORDER_CALL_KPMG_CREATE_CONTRACT_ERROR',
        error: err.message,
        validationErrors: err.response?.data?.errors,
        orderFormId: body.orderFormId,
      })
    }

    ctx.body = { status: 'OK', orderFormId: body.orderFormId }
    ctx.status = 200

    await next()
  } catch (error) {
    const err = error as Error & { name: string }

    logger.error({
      message: 'NEW_ORDER_WRAPPER_ERROR',
      error: err.message,
      name: err.name,
    })

    ctx.body = {
      status: err.name,
      message: err.message,
    }
    ctx.status = 400
  }
}
