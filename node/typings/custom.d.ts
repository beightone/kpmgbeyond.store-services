import type {
  IOClients,
  ParamsContext,
  RecorderState,
  RouteHandler,
  ServiceContext,
} from '@vtex/api'

declare global {
  /**
   * Next middleware function type
   */
  type NextMiddleware = () => Promise<void>
}

/**
 * HTTP methods supported by VTEX method helper
 */
type HTTPMethods =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH'
  | 'DEFAULT'

/**
 * Method options for route handlers
 */
type MethodOptions<
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> = Partial<
  Record<
    HTTPMethods,
    | RouteHandler<ClientsT, StateT, CustomT>
    | Array<RouteHandler<ClientsT, StateT, CustomT>>
  >
>

/**
 * Custom context fields for extended functionality
 */
interface CustomContextFields extends ParamsContext {
  trackerId?: string
}

/**
 * Nullable type helper
 */
type Nullable<T> = T | null

/**
 * Convert optional properties to nullable
 */
type OptionalToNullable<T> = {
  [K in keyof T]-?: undefined extends T[K] ? NonNullable<T[K]> | null : T[K]
}

/**
 * Make specific properties required
 */
type PickRequired<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P]
}
