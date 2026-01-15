import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

/**
 * Order totals structure
 */
export interface IOrderTotal {
  id: string
  name: string
  value: number
}

/**
 * Order data structure (simplified)
 */
export interface IOrderData {
  orderId: string
  orderFormId: string
  sequence: string
  status: string
  statusDescription: string
  value: number
  creationDate: string
  clientProfileData: {
    email: string
    firstName: string
    lastName: string
    document: string
    documentType: string
    phone: string
    corporateName?: string
    tradeName?: string
    corporateDocument?: string
  }
  shippingData: {
    address: {
      city: string
      state: string
      country: string
      postalCode: string
      street: string
      number: string
      complement?: string
      neighborhood: string
    }
  }
  items: Array<{
    id: string
    productId: string
    name: string
    skuName: string
    quantity: number
    price: number
    sellingPrice: number
  }>
  totals: IOrderTotal[]
}

/**
 * VTEX OMS Client for Order Management
 * Uses JanusClient for internal VTEX API calls with custom auth
 */
export class VtexOmsClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   * @param appKey - VTEX App Key
   * @param appToken - VTEX App Token
   */
  public async getOrder(
    orderId: string,
    appKey: string,
    appToken: string
  ): Promise<IOrderData> {
    return this.http.get<IOrderData>(`/api/oms/pvt/orders/${orderId}`, {
      headers: {
        'X-VTEX-API-AppKey': appKey,
        'X-VTEX-API-AppToken': appToken,
      },
      metric: 'vtex-oms-get-order',
    })
  }
}
