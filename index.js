const accessControlHeaders = require('./lib/accessControlHeaders');
const errorHandler = require('./lib/errorHandler');
const authenticate = require('./lib/authentication/authenticate');

module.exports = {
  accessControlHeaders,
  authenticate,
  errorHandler,
};
