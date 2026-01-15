import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * B2C OAuth token response
 */
export interface IB2CTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

/**
 * B2C Authentication Client for KPMG Azure B2C
 * Encapsulates external OAuth calls following VTEX IO guidelines
 */
export class B2CAuthClient extends ExternalClient {
  private static readonly CLIENT_ID = 'd37def41-3c14-4af7-ac2e-d92e1ce4e983'
  private static readonly SCOPE = 'd37def41-3c14-4af7-ac2e-d92e1ce4e983'

  constructor(context: IOContext, options?: InstanceOptions) {
    super(
      'https://kpmgamrb2c.b2clogin.com/kpmgamrb2c.onmicrosoft.com/B2C_1_ROPC/oauth2/v2.0',
      context,
      {
        ...options,
        retries: 2,
        headers: {
          ...options?.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Vtex-Use-Https': 'true',
        },
      }
    )
  }

  /**
   * Authenticate with ROPC flow and get access token
   * @param username - B2C username
   * @param password - B2C password
   */
  public async getToken(
    username: string,
    password: string
  ): Promise<IB2CTokenResponse> {
    const body = new URLSearchParams({
      username,
      password,
      grant_type: 'password',
      scope: B2CAuthClient.SCOPE,
      client_id: B2CAuthClient.CLIENT_ID,
      response_type: 'token',
    }).toString()

    return this.http.post<IB2CTokenResponse>('/token', body, {
      metric: 'b2c-auth-token',
    })
  }
}
