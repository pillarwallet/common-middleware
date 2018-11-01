const accessControlHeaders = require('./lib/accessControlHeaders');
const errorHandler = require('./lib/errorHandler');
const authorize = require('./lib/authentication/authorize');

module.exports = {
  accessControlHeaders,
  authorize,
  errorHandler,
};
