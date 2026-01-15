import { IOClients, MasterData } from '@vtex/api'

import { B2CAuthClient } from './b2c-auth'
import { DatadogClient } from './datadog'
import { KPMGAuthClient } from './kpmg-auth'
import { KPMGClient } from './kpmg'
import { KPMGDevClient } from './kpmg-dev'
import { MasterDataContextClient } from './master-data-context'
import { Promotions } from './promotions'
import { RDStationClient } from './rd-station'
import { ReceitaWsClient } from './receita-ws'
import { StatusClient } from './status'
import { SubscriptionsClient } from './subscriptions'
import { VtexOmsClient } from './vtex-oms'

/**
 * Extend the default IOClients implementation with our own custom clients.
 * All clients are injected via ctx.clients
 */
export class Clients extends IOClients {
  /**
   * Promotions API client
   */
  public get promotions() {
    return this.getOrSet('promotions', Promotions)
  }

  /**
   * Status client for HTTP status testing
   */
  public get status() {
    return this.getOrSet('status', StatusClient)
  }

  /**
   * VTEX OMS client with custom authentication
   */
  public get vtexOms() {
    return this.getOrSet('vtexOms', VtexOmsClient)
  }

  /**
   * KPMG Authentication client for /api/Token/GetToken
   */
  public get kpmgAuth() {
    return this.getOrSet('kpmgAuth', KPMGAuthClient)
  }

  /**
   * KPMG Beyond API client (production)
   */
  public get kpmg() {
    return this.getOrSet('kpmg', KPMGClient)
  }

  /**
   * KPMG Beyond API client (development)
   */
  public get kpmgDev() {
    return this.getOrSet('kpmgDev', KPMGDevClient)
  }

  /**
   * Default MasterData client
   */
  public get masterdata() {
    return this.getOrSet('masterdata', MasterData)
  }

  /**
   * MasterData client with app settings context (appKey/appToken)
   */
  public get masterDataContext() {
    return this.getOrSet('masterDataContext', MasterDataContextClient)
  }

  /**
   * Datadog logging client
   */
  public get datadog() {
    return this.getOrSet('datadog', DatadogClient)
  }

  /**
   * ReceitaWS client for CNPJ lookup
   */
  public get receitaWs() {
    return this.getOrSet('receitaWs', ReceitaWsClient)
  }

  /**
   * RD Station client for marketing automation
   */
  public get rdStation() {
    return this.getOrSet('rdStation', RDStationClient)
  }

  /**
   * B2C Authentication client for KPMG Azure B2C
   */
  public get b2cAuth() {
    return this.getOrSet('b2cAuth', B2CAuthClient)
  }

  /**
   * Subscriptions client for VTEX subscriptions API
   */
  public get subscriptions() {
    return this.getOrSet('subscriptions', SubscriptionsClient)
  }
}
