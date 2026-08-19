export function notFoundHandler(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  void next;
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    ...(err.payload && typeof err.payload === "object" ? err.payload : {}),
    ...(err.code ? { code: err.code } : {}),
    ...(err.responseStatus ? { status: err.responseStatus } : {}),
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
  });
}
