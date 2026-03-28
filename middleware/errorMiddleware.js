const errorHandler = (err, req, res, next) => {
  // If no status code was set by the controller, default to 500 (Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    
    // Security: Only show the "stack trace" (detailed code error) in development.
    // In production, we hide this so hackers can't see your folder structure.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };