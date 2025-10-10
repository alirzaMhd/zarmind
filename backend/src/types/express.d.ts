// ==========================================
// ZARMIND - Express Type Extensions
// ==========================================

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Unique request ID for tracking
       */
      requestId?: string;
      
      /**
       * Request start time for performance tracking
       */
      startTime?: number;
      
      /**
       * Authenticated user information
       */
      user?: {
        userId: string;
        username: string;
        role?: string;
        [key: string]: any;
      };
      
      /**
       * File upload information (from multer)
       */
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
    
    interface Response {
      /**
       * Send success response helper
       */
      sendSuccess?<T = any>(
        data?: T,
        message?: string,
        meta?: any
      ): Response;
      
      /**
       * Send error response helper
       */
      sendError?(
        message: string,
        statusCode?: number,
        errors?: any[]
      ): Response;
    }
  }
}

export {};