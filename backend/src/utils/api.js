export function success(res, data, message = 'Operation successful', status = 200) {
  res.status(status).json({ success: true, data, message })
}

export function fail(res, code, message, status = 400, details = []) {
  res.status(status).json({ success: false, error: { code, message, details } })
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
