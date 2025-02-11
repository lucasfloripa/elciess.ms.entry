import { type IAuthUserUsecase } from '../../domain/contracts'
import { UnauthorizedError, ForbiddenError } from '../../domain/errors'
import { type IUserCredentialsDTO } from '../../domain/ports/inbounds'
import { type IAuthUserResponse } from '../../domain/ports/outbounds'
import { logError, log } from '../../utils/log'
import { type IValidation } from '../contracts'
import {
  type IHttpResponse,
  type IController,
  htttpResponses
} from '../protocols'

export class AuthUserController implements IController {
  constructor(
    private readonly authUserUsecase: IAuthUserUsecase,
    private readonly validator: IValidation
  ) {}

  async handle(
    credentials: IUserCredentialsDTO
  ): Promise<IHttpResponse<IAuthUserResponse>> {
    try {
      log('AuthUserController request', credentials)
      const hasInputError = this.validator.validate(credentials)
      if (hasInputError) {
        logError('AuthUserController error:', hasInputError)
        return htttpResponses.http400(hasInputError)
      }

      const ucResponse = await this.authUserUsecase.execute(credentials)

      if (ucResponse instanceof UnauthorizedError) {
        logError('AuthUserController error:', 'User not found')
        return htttpResponses.http401(ucResponse)
      }

      if (ucResponse instanceof ForbiddenError) {
        logError('AuthUserController error:', 'Invalid password')
        return htttpResponses.http403(ucResponse)
      }

      log('AuthUserController response', ucResponse)
      return htttpResponses.http200(ucResponse)
    } catch (error) {
      return htttpResponses.http500(error)
    }
  }
}
