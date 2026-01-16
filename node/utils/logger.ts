import type { Logger as VTEXLogger } from '@vtex/api'
import { LogLevel } from '@vtex/api'

/**
 * Custom Logger wrapper for VTEX logger
 * Provides consistent logging interface with optional production logging
 */
export class Logger {
  private readonly logger: VTEXLogger
  private readonly logInProd: boolean

  constructor(logger: VTEXLogger, logInProd = false) {
    this.logger = logger
    this.logInProd = logInProd
  }

  /**
   * Log an info message
   */
  public info = (
    message: string,
    data?: Record<string, unknown>,
    options?: { trackerId?: string }
  ): void => {
    this.log({ message, ...data, trackerId: options?.trackerId }, LogLevel.Info)
  }

  /**
   * Log an error message
   */
  public error = (
    message: string,
    data?: Record<string, unknown>,
    options?: { trackerId?: string }
  ): void => {
    this.log(
      { message, ...data, trackerId: options?.trackerId },
      LogLevel.Error
    )
  }

  /**
   * Log a warning message
   */
  public warn = (
    message: string,
    data?: Record<string, unknown>,
    options?: { trackerId?: string }
  ): void => {
    this.log({ message, ...data, trackerId: options?.trackerId }, LogLevel.Warn)
  }

  private log = (content: Record<string, unknown>, type: LogLevel): void => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(content))

    if (this.logInProd) {
      this.logger.log(content, type)
    }
  }
}
