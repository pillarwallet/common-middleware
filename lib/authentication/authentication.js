const signature = require('./mechanisms/verifySignature');
// const jwt = require('./mechanisms/verifyJwt');

module.exports = (req, res, next) => {
  if (req.get('X-API-Signature')) {
    return signature(req, res, next);
  }

  if (req.get('Authorization')) {
    //
  }

  return next();
};
