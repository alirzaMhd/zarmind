import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: PrismaClientKnownRequestError | PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let error =
      new BadRequestException('Database error. Please verify your input and try again.');

    if (exception instanceof PrismaClientValidationError) {
      error = new BadRequestException('Invalid data for database operation');
    } else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000':
          error = new BadRequestException('Value too long for column');
          break;
        case 'P2002': {
          const meta = exception.meta as any;
          const fields = Array.isArray(meta?.target) ? meta.target.join(', ') : meta?.target;
          error = new ConflictException(`Unique constraint failed on: ${fields ?? 'field'}`);
          break;
        }
        case 'P2003':
          error = new BadRequestException('Operation violates foreign key constraint');
          break;
        case 'P2011':
          error = new BadRequestException('Null constraint violation');
          break;
        case 'P2012':
          error = new BadRequestException('Missing a required value');
          break;
        case 'P2014':
          error = new BadRequestException(
            'Invalid relation: this change would violate a required relation',
          );
          break;
        case 'P2016':
          error = new BadRequestException('Query interpretation error');
          break;
        case 'P2018':
          error = new NotFoundException('Required connected records were not found');
          break;
        case 'P2019':
          error = new BadRequestException('Input error');
          break;
        case 'P2020':
          error = new BadRequestException('Value out of range');
          break;
        case 'P2025':
          error = new NotFoundException('Record not found');
          break;
        default:
          error = new InternalServerErrorException(`Prisma error code: ${exception.code}`);
          break;
      }
    }

    const status = (error.getStatus && error.getStatus()) || 400;
    const body =
      (typeof error.getResponse === 'function' && error.getResponse()) || error.message;

    response.status(status).json({
      statusCode: status,
      message: typeof body === 'string' ? body : (body as any)?.message ?? 'Database error',
      error: (error as any)?.name ?? 'Error',
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}