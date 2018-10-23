const accessControlHeaders = require('./lib/accessControlHeaders');
const errorHandler = require('./lib/errorHandler');
const authentication = require('./lib/authentication/authentication');

module.exports = {
  accessControlHeaders,
  authentication,
  errorHandler,
};
