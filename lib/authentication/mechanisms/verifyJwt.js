const jwt = require('jsonwebtoken');
const boom = require('boom');

const verify = (token, secretOrPublicKey, options = {}) => {
  /**
   * At the moment, this is pretty much a pass-through to
   * the jwt.verify method.
   */
  if (!token) {
    return boom.badRequest('No token found.');
  }

  if (!secretOrPublicKey) {
    return boom.badRequest('No secret or public key found.');
  }

  return jwt.verify(token, secretOrPublicKey, options);
};

module.exports = verify;
