export async function calculatePromotionsDiscounts(
  ctx: Context,
  next: NextMiddleware
) {
  const {
    state: { promotions = [] },
  } = ctx

  const pixPromotion = promotions.find(({ paymentsMethods }) =>
    paymentsMethods.some(({ id }) => id === '125')
  )

  const sortedPromotionsByBestDiscount = [...promotions].sort(
    (prevPromotion, currPromotion) =>
      currPromotion.percentualDiscountValue -
      prevPromotion.percentualDiscountValue
  )

  const otherPromotionsDiscountsMap = sortedPromotionsByBestDiscount.reduce(
    (
      prev,
      { idCalculatorConfiguration: id, name, percentualDiscountValue }
    ) => {
      if (
        id === pixPromotion?.idCalculatorConfiguration ||
        !percentualDiscountValue
      ) {
        return prev
      }

      return {
        ...prev,
        [name]: percentualDiscountValue,
      }
    },
    {}
  )

  const bestOtherPromotion = sortedPromotionsByBestDiscount.find(
    ({ idCalculatorConfiguration }) =>
      idCalculatorConfiguration !== pixPromotion?.idCalculatorConfiguration
  )

  ctx.response.status = 200
  ctx.response.body = {
    pixPercentual: pixPromotion?.percentualDiscountValue ?? 0,
    promotionPercentual: bestOtherPromotion?.percentualDiscountValue ?? 0,
    ...otherPromotionsDiscountsMap,
  }

  await next()
}
