import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * KPMG Token response from /api/Token/GetToken
 */
export interface IKPMGTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * KPMG Authentication Client
 * Uses the documented /api/Token/GetToken endpoint with form-data
 */
export class KPMGAuthClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://contrato.beyond.kpmg.com.br', context, {
      ...options,
      retries: 2,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Get authentication token from KPMG API
   * Endpoint: POST /api/Token/GetToken (form-data)
   * @param username - Service or user credentials username
   * @param password - Service or user credentials password
   * @returns Token response with access_token, token_type (Bearer), expires_in
   */
  public async getToken(
    username: string,
    password: string,
    logger?: Context['vtex']['logger']
  ): Promise<IKPMGTokenResponse> {
    logger?.info({
      message: 'KPMG_AUTH_GET_TOKEN_START',
      username,
    })

    const formData = new URLSearchParams({
      username,
      password,
    }).toString()

    try {
      const response = await this.http.post<IKPMGTokenResponse>(
        '/api/Token/GetToken',
        formData,
        {
          metric: 'kpmg-auth-get-token',
        }
      )

      logger?.info({
        message: 'KPMG_AUTH_GET_TOKEN_SUCCESS',
        tokenType: response.token_type,
        expiresIn: response.expires_in,
      })

      return response
    } catch (error) {
      const err = error as Error & {
        response?: { status: number; data: unknown }
      }

      logger?.error({
        message: 'KPMG_AUTH_GET_TOKEN_ERROR',
        error: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
      })

      throw new Error(
        `Error getting KPMG token: ${err.response?.status || err.message}`
      )
    }
  }
}
