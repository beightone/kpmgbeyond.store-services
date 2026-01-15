import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * Conversion event payload structure
 */
export interface IConversionPayload {
  conversion_identifier?: string
  email?: string
  name?: string
  job_title?: string
  company_name?: string
  company_site?: string
  mobile_phone?: string
  personal_phone?: string
  city?: string
  state?: string
  country?: string
  cf_custom_field?: string
  [key: string]: unknown
}

/**
 * RD Station API response
 */
export interface IRDStationResponse {
  event_uuid?: string
}

/**
 * RD Station Client for marketing automation
 * Encapsulates external API calls following VTEX IO guidelines
 */
export class RDStationClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('https://api.rd.services', context, {
      ...options,
      retries: 2,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Send conversion event to RD Station
   * @param payload - Conversion event data
   * @param apiKey - RD Station API key
   */
  public async sendConversion(
    payload: IConversionPayload,
    apiKey: string
  ): Promise<IRDStationResponse> {
    return this.http.post<IRDStationResponse>(
      `/platform/conversions?api_key=${apiKey}`,
      {
        event_type: 'CONVERSION',
        event_family: 'CDP',
        payload,
      },
      {
        metric: 'rd-station-conversion',
      }
    )
  }
}
