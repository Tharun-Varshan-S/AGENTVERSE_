const rateLimit = require('express-rate-limit');

const publicComplaintLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many complaints submitted from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' }
});

const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Admin API rate limit exceeded' }
});

module.exports = {
  publicComplaintLimiter,
  authLimiter,
  adminApiLimiter
};
