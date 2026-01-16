import type { ClientsConfig } from '@vtex/api'
import { LRUCache, Service, method } from '@vtex/api'

import { Clients } from './clients'
import {
  // Promotions
  getPromotion,
  filterPromotions,
  getPromotionsSettings,
  listAllPromotions,
  calculatePromotionsDiscounts,
  // KPMG
  cancelSubscription,
  lookupCnpj,
  createOrderRelation,
  findOrderRelation,
  health,
  registerInterestedUser,
  checkUserRegistration,
  keepalive,
  getKpmgOrderToken,
  createNewOrder,
  createNewOrderUpright,
  populateScheduleForm,
  sendRdStationConversion,
  registerInDataEntity,
  status,
  withAppSettings,
  // Events
  webhook,
} from './middlewares'

const DEFAULT_TIMEOUT_MS = 10 * 1000 // 10 seconds
const memoryCache = new LRUCache<string, never>({ max: 5000 })

metrics.trackCache('promotions', memoryCache)

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: DEFAULT_TIMEOUT_MS,
    },
    promotions: {
      memoryCache,
    },
  },
}

export default new Service({
  clients,
  events: {
    webhook,
  },
  routes: {
    // Promotions routes
    getPromotion: method({
      GET: [getPromotion],
    }),
    productPromotions: method({
      GET: [
        listAllPromotions,
        getPromotionsSettings,
        filterPromotions,
        calculatePromotionsDiscounts,
      ],
    }),
    // KPMG routes
    cnpj: method({
      GET: [withAppSettings, lookupCnpj],
    }),
    order: method({
      POST: [withAppSettings, createNewOrder],
    }),
    orderUpright: method({
      POST: [withAppSettings, createNewOrderUpright],
    }),
    interestedUser: method({
      POST: [withAppSettings, registerInterestedUser],
    }),
    populateScheduleForm: method({
      POST: [withAppSettings, populateScheduleForm],
    }),
    cancelSubscription: method({
      POST: [withAppSettings, cancelSubscription],
    }),
    rdStation: method({
      POST: [withAppSettings, sendRdStationConversion],
    }),
    status: method({
      GET: [status],
    }),
    keepalive: method({
      POST: [keepalive],
    }),
    createRelation: method({
      POST: [withAppSettings, createOrderRelation],
    }),
    findRelation: method({
      POST: [findOrderRelation],
    }),
    health: method({
      GET: [health],
    }),
    isUserRegistered: method({
      GET: [withAppSettings, checkUserRegistration],
    }),
    registerInDataEntity: method({
      POST: [withAppSettings, registerInDataEntity],
    }),
    kpmgOrderToken: method({
      GET: [withAppSettings, getKpmgOrderToken],
    }),
  },
})
