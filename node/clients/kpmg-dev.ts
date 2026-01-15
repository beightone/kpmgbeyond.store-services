import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import type { IKPMGRequestData } from './kpmg'

/**
 * KPMG Dev External Client for development/staging environment
 * Connects to KPMG Beyond DEV API
 */
export class KPMGDevClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://contrato-dev.beyond.kpmg.com.br', context, {
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
      metric: 'kpmg-dev-health',
    })
  }

  /**
   * Create a new contract in KPMG DEV system
   * @param data - Request data with body and headers
   */
  public createContract(data: IKPMGRequestData): Promise<string> {
    return this.http.post('/api/Venda/Contratar', data.body, {
      headers: data.headers,
      metric: 'kpmg-dev-create-contract',
    })
  }

  /**
   * Register a payment in KPMG DEV system
   * @param data - Request data with body and headers
   */
  public registerPayment(data: IKPMGRequestData): Promise<string> {
    return this.http.post('/api/Pagamento/SalvarPagamento', data.body, {
      headers: data.headers,
      metric: 'kpmg-dev-register-payment',
    })
  }
}
