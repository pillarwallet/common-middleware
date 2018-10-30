const verifySignature = require('./mechanisms/verifySignature');
// const jwt = require('./mechanisms/verifyJwt');

module.exports = (req, res, next) => {
  if (req.get('X-API-Signature')) {
    return verifySignature(req, res, next);
  }

  if (req.get('Authorization')) {
    return verifySignature(req, res, next);
  }

  return next();
};
