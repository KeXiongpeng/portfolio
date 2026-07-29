// server/src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 打印完整错误堆栈到控制台，便于调试
    console.error('[ExceptionFilter]', exception);

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorMessage = typeof message === 'string' ? message : (message as any).message || 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
    });
  }
}
