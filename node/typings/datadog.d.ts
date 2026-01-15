/**
 * Generic object type for flexible data structures
 */
export type GenericObject = Record<string, unknown>

/**
 * Log type levels supported by Datadog
 */
export type LogType = 'INFO' | 'WARN' | 'ERROR'

/**
 * HTTP details for Datadog logs
 */
export interface Http {
  url?: string
  status_code?: number
  method?: string
  referer?: string
  request_id?: string
  useragent?: string
  version?: string
  url_details: {
    host?: string
    port?: string
    path?: string
    queryString?: string
    scheme?: string
  }
}

/**
 * Log body structure for Datadog
 */
export interface LogBody {
  ddsource: string
  ddtags: string
  hostname: string
  message: string
  service: string
  status: LogType
  contextId: string
  account: string
  content: GenericObject
  http: Http
}
