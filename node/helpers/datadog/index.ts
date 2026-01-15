import type { GenericObject, Http, LogBody, LogType } from '../../typings/datadog.d'

/**
 * Creates a formatted log body for Datadog
 * @param contextId - Unique identifier for the context
 * @param textReference - Message/reference text
 * @param content - Additional content/data
 * @param type - Log level type
 * @returns Formatted LogBody for Datadog API
 */
export function datadogLog(
  contextId: string,
  textReference: string,
  content: GenericObject,
  type: LogType
): LogBody {
  const http: Http = {
    url_details: {},
  }

  const [appName] = (process.env.VTEX_APP_ID ?? '').split('@')

  return {
    ddsource: 'vtex',
    ddtags: `env:${process.env.VTEX_WORKSPACE},version:${process.env.VTEX_APP_VERSION},datadog.index:integration`,
    hostname: `${process.env.VTEX_ACCOUNT}`,
    message: textReference,
    service: appName ?? process.env.VTEX_APP_ID ?? 'unknown',
    status: type,
    contextId,
    account: `${process.env.VTEX_ACCOUNT}`,
    http,
    content: {
      ...content,
    },
  }
}
