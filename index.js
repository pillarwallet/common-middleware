const accessControlHeaders = require('./lib/accessControlHeaders');
const errorHandler = require('./lib/errorHandler');
const authenticate = require('./lib/authentication/authenticate');
const authorize = require('./lib/authentication/authorize');

module.exports = {
  accessControlHeaders,
  authenticate,
  authorize,
  errorHandler,
};
