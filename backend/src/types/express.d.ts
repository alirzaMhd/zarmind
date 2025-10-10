// src/types/express.d.ts
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    startTime?: number;
    user?: {
      userId?: string;
      [key: string]: any;
    };
  }

  interface Response {
    sendSuccess<T = any>(
      data?: T,
      message?: string,
      meta?: any
    ): this;

    sendError(
      message: string,
      statusCode?: number,
      errors?: import('../types').IValidationError[]
    ): this;
  }
}