import type { Promotion } from '../../clients/promotions'

export async function getPromotionsSettings(
  ctx: Context,
  next: NextMiddleware
): Promise<void> {
  const {
    clients: { promotions: promotionsClient },
    state: { listedPromotions = [] },
  } = ctx

  const activePromotions = listedPromotions.filter(
    ({ status }) => status === 'active'
  )

  const promotionsSettingsPromises = activePromotions.map(
    ({ idCalculatorConfiguration }) =>
      promotionsClient.getById(idCalculatorConfiguration)
  )

  const promotionsResults = await Promise.allSettled(promotionsSettingsPromises)

  const successfulPromotionsSettings = promotionsResults
    .filter((result): result is PromiseFulfilledResult<Promotion> => {
      return result.status === 'fulfilled'
    })
    .map((result) => result.value)

  ctx.state.promotions = successfulPromotionsSettings

  await next()
}
