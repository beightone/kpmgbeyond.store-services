import zlib from 'zlib'

import type { InstanceOptions, IOContext } from '@vtex/api'
import { CacheType, JanusClient } from '@vtex/api'
import type {
  CalculatorConfiguration,
  GetAllBenefitsResponse,
} from '@vtex/clients'

import { TEN_MINUTES_S } from '../constants'

export class Promotions extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
        VtexIdclientAutcookie: ctx.authToken ?? '',
      },
      cacheableType: CacheType.None,
    })
  }

  public async getAll() {
    /*
     * This endpoint returns his content in an encoding not supported by the current axios version (v0.21.4),
     * When axios try to decompress the content, we receive an error, in order to prevent that we turn off that behaviour
     * with decompress option equal to "false"
     * */
    const buffer = await this.http.get<ArrayBuffer>(
      '/api/rnb/pvt/benefits/calculatorconfiguration',
      {
        decompress: false,
        responseType: 'arraybuffer',
        metric: 'get-all-promotions',
        forceMaxAge: TEN_MINUTES_S,
      }
    )

    const strResponse = zlib.unzipSync(buffer).toString()

    return JSON.parse(strResponse) as GetAllBenefitsResponse
  }

  public async getById(id: string) {
    return this.http.get<Promotion>(
      `/api/rnb/pvt/calculatorconfiguration/${id}`,
      {
        metric: 'get-promotion',
        forceMaxAge: TEN_MINUTES_S,
      }
    )
  }
}

export interface Promotion
  extends Omit<CalculatorConfiguration, 'products' | 'paymentsMethods'> {
  skus: Array<{
    id: string
    name: string
  }>
  products: Array<{
    id: string
    name: string
  }>
  paymentsMethods: Array<{
    id: string
    name: string
  }>
}
