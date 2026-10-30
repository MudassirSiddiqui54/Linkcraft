export class AppError extends Error {
  constructor(status, message, code = 'REQUEST_ERROR') { super(message); this.status = status; this.code = code; }
}
export function notFound(req, res) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err?.name === 'ZodError') return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.issues.map(x => x.message).join(' ') } });
  if (err?.code === 11000) return res.status(409).json({ error: { code: 'ALIAS_TAKEN', message: 'That alias is already in use. Choose another one.' } });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Something went wrong. Please try again.' : err.message } });
}
