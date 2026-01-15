import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { datadogLog } from '../helpers/datadog'
import type { GenericObject, LogType } from '../typings/datadog.d'

/**
 * Datadog Client for sending logs to Datadog
 * Only sends logs in master workspace
 */
export class DatadogClient extends ExternalClient {
  private type: LogType = 'INFO'

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('http://http-intake.logs.datadoghq.com/api/v2', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'DD-API-KEY': process.env.DATADOG_API_KEY ?? '',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Send log to Datadog
   * Only sends in master workspace, console.info in other workspaces
   */
  private sendLog(
    contextId: string,
    textReference: string,
    content: GenericObject
  ): Promise<unknown> | null {
    if (this.context.workspace !== 'master') {
      // eslint-disable-next-line no-console
      console.info(content)

      return null
    }

    try {
      const data = datadogLog(contextId, textReference, content, this.type)

      return this.http.post('/logs', data, {
        metric: 'datadog-log',
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.info(err)

      return null
    }
  }

  /**
   * Send an INFO level log
   */
  public infoLog(
    contextId: string,
    textReference: string,
    content: GenericObject
  ): Promise<unknown> | null {
    this.type = 'INFO'

    return this.sendLog(contextId, textReference, content)
  }

  /**
   * Send a WARN level log
   */
  public warnLog(
    contextId: string,
    textReference: string,
    content: GenericObject
  ): Promise<unknown> | null {
    this.type = 'WARN'

    return this.sendLog(contextId, textReference, content)
  }

  /**
   * Send an ERROR level log
   */
  public errorLog(
    contextId: string,
    textReference: string,
    error: GenericObject
  ): Promise<unknown> | null {
    this.type = 'ERROR'

    return this.sendLog(contextId, textReference, error)
  }
}
