type ThrottledFunction<T extends unknown[]> = (...args: T) => Promise<unknown>

/**
 * Creates a throttled version of an async function
 * Ensures the function is not called more frequently than the specified wait time
 *
 * @param fn - The async function to throttle
 * @param wait - Minimum time between calls in milliseconds
 * @returns Throttled version of the function
 */
export async function throttleAsync<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>,
  wait: number
): Promise<ThrottledFunction<T>> {
  let lastRun = 0

  async function throttled(...args: T): Promise<unknown> {
    const currentWait = lastRun + wait - Date.now()
    const shouldRun = currentWait <= 0

    if (shouldRun) {
      lastRun = Date.now()

      return fn(...args)
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(throttled(...args))
      }, currentWait)
    })
  }

  return throttled
}
