const boom = require('boom');

module.exports = (req, res, next) => {
  const env = req.get('Network');
  if (!env) {
    req.headers.Network = 'qa';
    // TODO: uncomment this line in the future
    // return next(boom.badRequest('Missing network header in the request.'));
  } else if (!['prod', 'qa', 'dev'].includes(env)) {
    return next(boom.badRequest('Invalid network set in the request.'));
  }
  return next();
};
