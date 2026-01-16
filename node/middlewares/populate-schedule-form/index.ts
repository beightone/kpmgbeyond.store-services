import { json } from 'co-body'

/**
 * Schedule form request body
 */
interface IScheduleFormBody {
  corporateEmail: string
  companyName: string
  department: string
  employeesNumber: string
  name: string
  phone: string
  role: string
}

/**
 * Populate schedule form middleware
 * Registers user interest schedule data using MasterData client
 */
export async function populateScheduleForm(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const {
    clients: { masterDataContext },
    vtex: { logger },
  } = ctx

  try {
    const body = (await json(ctx.req)) as IScheduleFormBody

    logger.info({
      message: 'POPULATE_SCHEDULE_FORM_START',
      email: body.corporateEmail,
      companyName: body.companyName,
    })

    const response = await masterDataContext.registerInDataEntity(
      {
        corporateEmail: body.corporateEmail,
        companyName: body.companyName,
        department: body.department,
        employeesNumber: body.employeesNumber,
        name: body.name,
        phone: body.phone,
        role: body.role,
      },
      'UI',
      logger
    )

    logger.info({
      message: 'POPULATE_SCHEDULE_FORM_SUCCESS',
      email: body.corporateEmail,
    })

    ctx.body = { status: 'OK', data: response.data }
    ctx.status = 200
  } catch (error) {
    const err = error as Error & { name: string }

    logger.error({
      message: 'POPULATE_SCHEDULE_FORM_ERROR',
      error: err.message,
    })

    ctx.body = {
      status: err.name,
      message: err.message,
    }
    ctx.status = 400
  }

  await next()
}
