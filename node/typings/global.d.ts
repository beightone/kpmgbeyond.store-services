import type { EventContext, ServiceContext, RecorderState } from '@vtex/api'
import type { GetAllBenefitsResponseItem } from '@vtex/clients'

import type { Clients } from '../clients'
import type { Promotion } from '../clients/promotions'
import type { Logger } from '../utils/logger'

/**
 * App settings from manifest.json settingsSchema
 */
interface AppSettings {
  appKey?: string
  appToken?: string
  receitaWsToken?: string
  rdStationApiKey?: string
  kpmgUsername?: string
  kpmgPassword?: string
  encryptionKey?: string
  // Legacy - may be deprecated
  b2cUsername?: string
  b2cPassword?: string
}

/**
 * Application state shared between middlewares
 */
interface PromotionsState {
  listedPromotions?: GetAllBenefitsResponseItem[]
  promotions?: Promotion[]
}

declare global {
  /**
   * Combined state type
   */
  type State = RecorderState & PromotionsState

  /**
   * Main service context type
   */
  type Context = ServiceContext<Clients, State> & {
    logger?: Logger
    vtex: ServiceContext<Clients, State>['vtex'] & {
      settings: AppSettings
    }
  }

  /**
   * Event context for webhook handlers
   */
  type StatusChangeContext = EventContext<Clients, State> & {
    body: StatusChangeBody
    vtex: EventContext<Clients, State>['vtex'] & {
      settings: AppSettings
    }
  }

  /**
   * Webhook event body structure
   */
  interface StatusChangeBody {
    orderId: string
    currentState: string
    currentChangeDate: string
  }
}
