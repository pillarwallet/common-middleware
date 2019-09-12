const boom = require('boom');

module.exports = (req, res, next) => {
  const env = req.get('Network');
  if (!env) {
    req.headers.Network = 'mainnet';
    // TODO: uncomment this line in the future
    // return next(boom.badRequest('Missing network header in the request.'));
  } else if (!['mainnet', 'rinkeby'].includes(env)) {
    return next(boom.badRequest('Invalid network set in the request.'));
  }
  return next();
};
