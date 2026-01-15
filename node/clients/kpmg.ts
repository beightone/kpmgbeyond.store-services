import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * Response type for KPMG contract operations
 */
export interface IKPMGContractResponse {
  success: boolean
  message?: string
  data?: Record<string, unknown>
}

/**
 * Request body and headers structure for KPMG API calls
 */
export interface IKPMGRequestData {
  body: Record<string, unknown>
  headers: Record<string, string>
}

/**
 * KPMG External Client for contract management
 * Connects to KPMG Beyond API for contract, payment and notification operations
 */
export class KPMGClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://contrato.beyond.kpmg.com.br', context, {
      ...options,
      retries: 2,
      headers: {
        ...options?.headers,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Health check endpoint
   */
  public health(): Promise<string> {
    return this.http.get('/health', {
      metric: 'kpmg-health',
    })
  }

  /**
   * Create a new contract in KPMG system
   * @param data - Request data with body and headers
   * @param logger - VTEX logger instance
   * @param trackerId - Tracking ID for logging
   */
  public async createContract(
    data: IKPMGRequestData,
    logger?: Context['vtex']['logger'],
    trackerId?: string
  ): Promise<IKPMGContractResponse> {
    logger?.info({
      message: 'KPMG_CLIENT_CREATE_CONTRACT_START',
      url: '/api/Venda/Contratar',
      bodyKeys: Object.keys(data.body || {}),
      hasAuthHeader: !!data.headers?.Authorization,
      trackerId,
    })

    try {
      const response = await this.http.post<IKPMGContractResponse>(
        '/api/Venda/Contratar',
        data.body,
        {
          headers: data.headers,
          metric: 'kpmg-create-contract',
        }
      )

      logger?.info({
        message: 'KPMG_CLIENT_CREATE_CONTRACT_SUCCESS',
        url: '/api/Venda/Contratar',
        response,
        trackerId,
      })

      return response
    } catch (error) {
      const err = error as Error & {
        response?: { status: number; data: { errors?: string[] } }
      }

      logger?.error({
        message: 'KPMG_CLIENT_CREATE_CONTRACT_ERROR',
        url: '/api/Venda/Contratar',
        error: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        validationErrors: err.response?.data?.errors,
        trackerId,
      })

      throw new Error(
        `Error calling /api/Venda/Contratar: ${
          err.response?.data?.errors?.join(', ') || err.message
        }`
      )
    }
  }

  /**
   * Edit an existing contract
   * @param data - Request data with body and headers
   */
  public editContract(data: IKPMGRequestData): Promise<string> {
    return this.http.post('/EditarContrato', data.body, {
      headers: data.headers,
      metric: 'kpmg-edit-contract',
    })
  }

  /**
   * Register a payment in KPMG system
   * @param data - Request data with body and headers
   * @param logger - VTEX logger instance
   * @param trackerId - Tracking ID for logging
   */
  public async registerPayment(
    data: IKPMGRequestData,
    logger?: Context['vtex']['logger'],
    trackerId?: string
  ): Promise<IKPMGContractResponse> {
    logger?.info({
      message: 'KPMG_CLIENT_REGISTER_PAYMENT_START',
      url: '/api/Pagamento/SalvarPagamento',
      bodyKeys: Object.keys(data.body || {}),
      hasAuthHeader: !!data.headers?.Authorization,
      trackerId,
    })

    try {
      const response = await this.http.post<IKPMGContractResponse>(
        '/api/Pagamento/SalvarPagamento',
        data.body,
        {
          headers: data.headers,
          metric: 'kpmg-register-payment',
        }
      )

      logger?.info({
        message: 'KPMG_CLIENT_REGISTER_PAYMENT_SUCCESS',
        url: '/api/Pagamento/SalvarPagamento',
        response,
        trackerId,
      })

      return response
    } catch (error) {
      const err = error as Error & {
        response?: { status: number; data: Record<string, unknown> }
      }

      logger?.error({
        message: 'KPMG_CLIENT_REGISTER_PAYMENT_ERROR',
        url: '/api/Pagamento/SalvarPagamento',
        error: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        trackerId,
      })

      throw error
    }
  }

  /**
   * Send a notification to KPMG system
   * @param data - Request data with body and headers
   */
  public sendNotification(data: IKPMGRequestData): Promise<string> {
    return this.http.post('/Notificacao', data.body, {
      headers: data.headers,
      metric: 'kpmg-notification',
    })
  }
}
