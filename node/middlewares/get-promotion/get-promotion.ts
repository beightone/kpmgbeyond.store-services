import { NotFoundError, UserInputError } from '@vtex/api'
import Joi from 'joi'

const schema = Joi.string().guid({
  version: ['uuidv4'],
})

export async function getPromotion(ctx: Context, next: () => Promise<void>) {
  const { promotions } = ctx.clients

  const {
    vtex: {
      route: { params },
    },
  } = ctx

  const { idCalculatorConfiguration } = params

  const { error } = schema.validate(idCalculatorConfiguration)

  if (error) {
    throw new UserInputError("The given ID it's not valid!")
  }

  const promotion = await promotions.getById(
    idCalculatorConfiguration as string
  )

  if (!promotion) {
    throw new NotFoundError("That promotion doesn't exist")
  }

  ctx.status = 200
  ctx.body = promotion

  await next()
}
