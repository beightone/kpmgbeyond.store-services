import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

/**
 * Subscription item structure
 */
export interface ISubscriptionItem {
  id: string
  skuId: string
  quantity: number
  seller: string
  originalOrderId?: string
  priceAtSubscriptionDate?: number
}

/**
 * Subscription plan structure
 */
export interface ISubscriptionPlan {
  id: string
  frequency: {
    periodicity: string
    interval: number
  }
  validity: {
    begin: string
    end?: string
  }
}

/**
 * Subscription data structure
 */
export interface ISubscriptionData {
  id: string
  status: string
  customerEmail: string
  items: ISubscriptionItem[]
  plan: ISubscriptionPlan
  purchaseSettings: {
    paymentSystemId: string
    addressId: string
    currencyCode: string
    selectedSla: string
  }
  shippingAddress: {
    city: string
    state: string
    country: string
  }
  lastUpdate: string
  isSkipped: boolean
  nextPurchaseDate: string
}

/**
 * Subscriptions Client for VTEX Subscriptions API
 * Uses JanusClient for internal VTEX API calls
 */
export class SubscriptionsClient extends JanusClient {
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
   * Get subscription by ID
   * @param subscriptionId - Subscription ID
   * @param appKey - VTEX App Key
   * @param appToken - VTEX App Token
   */
  public async getById(
    subscriptionId: string,
    appKey: string,
    appToken: string
  ): Promise<ISubscriptionData> {
    return this.http.get<ISubscriptionData>(
      `/api/rns/pub/subscriptions/${subscriptionId}`,
      {
        headers: {
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
        },
        metric: 'subscriptions-get-by-id',
      }
    )
  }

  /**
   * Update subscription
   * @param subscriptionId - Subscription ID
   * @param data - Updated subscription data
   * @param appKey - VTEX App Key
   * @param appToken - VTEX App Token
   */
  public async update(
    subscriptionId: string,
    data: Partial<ISubscriptionData>,
    appKey: string,
    appToken: string
  ): Promise<ISubscriptionData> {
    return this.http.patch<ISubscriptionData>(
      `/api/rns/pub/subscriptions/${subscriptionId}`,
      data,
      {
        headers: {
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
        },
        metric: 'subscriptions-update',
      }
    )
  }

  /**
   * Cancel subscription
   * @param subscriptionId - Subscription ID
   * @param appKey - VTEX App Key
   * @param appToken - VTEX App Token
   */
  public async cancel(
    subscriptionId: string,
    appKey: string,
    appToken: string
  ): Promise<ISubscriptionData> {
    return this.update(
      subscriptionId,
      { status: 'CANCELED' },
      appKey,
      appToken
    )
  }

  /**
   * Add item to subscription
   * @param subscriptionId - Subscription ID
   * @param item - Item data with skuId and quantity
   * @param appKey - VTEX App Key
   * @param appToken - VTEX App Token
   */
  public async addItem(
    subscriptionId: string,
    item: { skuId: string; quantity: number },
    appKey: string,
    appToken: string
  ): Promise<ISubscriptionItem> {
    return this.http.post<ISubscriptionItem>(
      `/api/rns/pub/subscriptions/${subscriptionId}/items`,
      item,
      {
        headers: {
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
        },
        metric: 'subscriptions-add-item',
      }
    )
  }

  /**
   * Update subscription item
   * @param subscriptionId - Subscription ID
   * @param itemId - Item ID within the subscription
   * @param data - Updated item data
   * @param appKey - VTEX App Key
   * @param appToken - VTEX App Token
   */
  public async updateItem(
    subscriptionId: string,
    itemId: string,
    data: { quantity: number },
    appKey: string,
    appToken: string
  ): Promise<ISubscriptionItem> {
    return this.http.patch<ISubscriptionItem>(
      `/api/rns/pub/subscriptions/${subscriptionId}/items/${itemId}`,
      data,
      {
        headers: {
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
        },
        metric: 'subscriptions-update-item',
      }
    )
  }
}
