import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

/**
 * Response structure for MasterData operations
 */
export interface IMasterDataResponse<T = unknown> {
  status?: number
  data?: T
  error?: string
}

/**
 * MasterData user document structure
 */
export interface IMasterDataUserDocument {
  productId?: string
  name?: string
  product?: string
  email?: string
  cnpj?: string
  createdIn?: string
}

/**
 * MasterData Client for context-aware operations
 * Uses appToken/appKey from app settings for authentication
 */
export class MasterDataContextClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    const settings = (
      ctx as unknown as { vtex?: { settings?: Record<string, string> } }
    ).vtex?.settings ?? {}

    const appToken = settings.appToken ?? ''
    const appKey = settings.appKey ?? ''

    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-VTEX-API-AppToken': appToken,
        'X-VTEX-API-AppKey': appKey,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Check if a user is registered by CNPJ in a specific data entity
   * @param cnpj - CNPJ number to search
   * @param dataEntity - Data entity to search in
   * @param logger - VTEX logger instance
   * @param trackerId - Tracking ID for logging
   */
  public async isUserRegistered(
    cnpj: string,
    dataEntity: string,
    logger?: Context['vtex']['logger'],
    trackerId?: string
  ): Promise<IMasterDataResponse<IMasterDataUserDocument[]>> {
    const queryUrl = `/api/dataentities/${dataEntity}/search?_fields=productId,name,product,email,product,cnpj,createdIn&_where=(cnpj=${cnpj})`

    logger?.info({
      message: 'MASTERDATA_IS_USER_REGISTERED_START',
      cnpj,
      dataEntity,
      queryUrl,
      trackerId,
    })

    try {
      const response = await this.http.get<IMasterDataUserDocument[]>(
        queryUrl,
        {
          metric: 'masterdata-is-user-registered',
        }
      )

      logger?.info({
        message: 'MASTERDATA_IS_USER_REGISTERED_SUCCESS',
        cnpj,
        dataEntity,
        responseLength: response?.length ?? 0,
        responseData: response,
        trackerId,
      })

      return {
        status: 200,
        data: response,
      }
    } catch (error) {
      const err = error as Error

      logger?.error({
        message: 'MASTERDATA_IS_USER_REGISTERED_ERROR',
        cnpj,
        dataEntity,
        error: err.message,
        stack: err.stack,
        trackerId,
      })

      return {
        error: err.message,
      }
    }
  }

  /**
   * Register a new document in a specific data entity
   * @param body - Document data to register
   * @param dataEntity - Target data entity
   * @param logger - VTEX logger instance
   * @param trackerId - Tracking ID for logging
   */
  public async registerInDataEntity<T = Record<string, unknown>>(
    body: T,
    dataEntity: string,
    logger?: Context['vtex']['logger'],
    trackerId?: string
  ): Promise<IMasterDataResponse> {
    const postUrl = `/api/dataentities/${dataEntity}/documents`

    logger?.info({
      message: 'MASTERDATA_REGISTER_START',
      dataEntity,
      bodyKeys: Object.keys((body as Record<string, unknown>) || {}),
      postUrl,
      trackerId,
    })

    try {
      const response = await this.http.post(postUrl, body, {
        metric: 'masterdata-register',
      })

      logger?.info({
        message: 'MASTERDATA_REGISTER_SUCCESS',
        dataEntity,
        response,
        trackerId,
      })

      return {
        status: 200,
        data: response,
      }
    } catch (error) {
      const err = error as Error

      logger?.error({
        message: 'MASTERDATA_REGISTER_ERROR',
        dataEntity,
        error: err.message,
        stack: err.stack,
        trackerId,
      })

      return {
        error: err.message,
      }
    }
  }
}
