const boom = require('boom');

module.exports = () => (req, res, next) => {
  const env = req.get('Network');
  if (!env) {
    return next(boom.badRequest('Missing network header in the request.'));
  }
  if (!['PROD', 'QA', 'DEV'].includes(env)) {
    return next(boom.badRequest('Invalid network set in the request.'));
  }
  return next();
};
