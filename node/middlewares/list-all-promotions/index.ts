export async function listAllPromotions(ctx: Context, next: NextMiddleware) {
  const {
    clients: { promotions: promotionsClient },
  } = ctx

  const allPromotions = await promotionsClient.getAll()

  ctx.state.listedPromotions = allPromotions.items

  await next()
}
