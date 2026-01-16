export async function filterPromotions(ctx: Context, next: NextMiddleware) {
  const {
    state: { promotions = [] },
    vtex: {
      route: {
        params: { id },
      },
    },
  } = ctx

  const filteredPromotions = promotions.filter(
    ({ products, skus, percentualDiscountValue }) =>
      (products.some(({ id: productId }) => productId === id) ||
        skus.some(({ id: skuId }) => skuId === id)) &&
      percentualDiscountValue
  )

  ctx.state.promotions = filteredPromotions

  await next()
}
