const timeoutMiddleware = (timeout) => {
  return (req, res, next) => {
    res.setTimeout(timeout, () => {
      const error = new Error("Request Timeout");
      error.status = 408; // Request Timeout status code
      next(error);
    });
    next();
  };
};

module.exports = timeoutMiddleware;
