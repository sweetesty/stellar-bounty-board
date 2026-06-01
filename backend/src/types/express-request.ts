import type { Request } from 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Correlation id for logs and error responses; set by request context middleware. */
    requestId: string;
  }
}

export type RequestWithId = Request & {
  requestId: string;
};
