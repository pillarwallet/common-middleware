const jwt = require('jsonwebtoken');
const boom = require('boom');

/**
 * @name verify
 * @description Attempts to verify the token against the secret or public key.
 *
 * @param {String} token The incoming token to verify
 * @param {String} secretOrPublicKey The incoming secret or public key
 * to verify the token against.
 * @param {Object} options An optional object that allows the configuration
 * of the `jsonwebtoken` module.
 *
 * @returns {String | Object<boom>}
 */
const verify = async (token, secretOrPublicKey, options = {}) => {
  let result;

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

  try {
    result = await jwt.verify(token, secretOrPublicKey, options);
  } catch (e) {
    return boom.unauthorized(e.message);
  }

  return result;
};

module.exports = verify;
