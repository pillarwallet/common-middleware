const { promisify } = require('util');

const jwt = require('jsonwebtoken');
const boom = require('boom');

const promisedJwtVerify = promisify(jwt.verify);

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
    return Promise.reject(boom.badRequest('No token found.'));
  }

  if (!secretOrPublicKey) {
    return Promise.reject(boom.badRequest('No secret or public key found.'));
  }

  try {
    result = await promisedJwtVerify(token, secretOrPublicKey, options);

    return result;
  } catch (e) {
    return Promise.reject(boom.unauthorized(e.message));
  }
};

module.exports = verify;
