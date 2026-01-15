import type { InstanceOptions, IOContext, IOResponse } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * Status Client for testing HTTP status codes
 * Useful for health checks and testing
 */
export class StatusClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://httpstat.us', context, {
      ...options,
      headers: {
        ...options?.headers,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Get a status code response as string
   */
  public async getStatus(status: number): Promise<string> {
    return this.http.get(status.toString(), {
      metric: 'status-get',
    })
  }

  /**
   * Get a status code response with headers
   */
  public async getStatusWithHeaders(
    status: number
  ): Promise<IOResponse<string>> {
    return this.http.getRaw(status.toString(), {
      metric: 'status-get-raw',
    })
  }
}
