export class AppError extends Error {
  constructor(code, message, status = 400, details = []) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') => new AppError('UNAUTHORIZED', msg, 401),
  forbidden: (msg = 'You do not have permission to perform this action') => new AppError('FORBIDDEN', msg, 403),
  notFound: (msg = 'Resource not found') => new AppError('NOT_FOUND', msg, 404),
  badRequest: (msg = 'Invalid request', details = []) => new AppError('VALIDATION_ERROR', msg, 400, details),
  conflict: (msg = 'Resource already exists') => new AppError('CONFLICT', msg, 409),
}
