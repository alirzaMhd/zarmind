import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
export declare class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: PrismaClientKnownRequestError | PrismaClientValidationError, host: ArgumentsHost): void;
}
//# sourceMappingURL=prisma-exception.filter.d.ts.map