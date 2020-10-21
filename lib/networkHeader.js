const boom = require('@hapi/boom');

module.exports = (req, res, next) => {
  const network = req.get('Network');
  if (!network) {
    req.headers.Network = 'mainnet';
    // TODO: uncomment this line in the future
    // return next(boom.badRequest('Missing network header in the request.'));
  } else if (!['mainnet', 'rinkeby'].includes(network)) {
    return next(boom.badRequest('Invalid network set in the request.'));
  }
  return next();
};
