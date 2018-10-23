const boom = require('boom');
const { verify } = require('@pillarwallet/plr-auth-sdk');

/**
 * @name verifySignature
 * @description
 *
 * @param {*} signature
 * @param {*} publicKey
 * @param {*} payload
 * @param {*} next
 */
const verifySignature = (signature, publicKey, next, payload = {}) => {
  if (!publicKey) {
    return next(boom.badRequest('No public key found.'));
  }

  if (!next) {
    return next(boom.badRequest('Next middleware caller reference not found.'));
  }

  if (!signature) {
    return next(boom.unauthorized('No signature found.'));
  }

  try {
    const fusedPayload = Object.assign(
      {
        signature,
      },
      payload,
    );

    if (verify(fusedPayload, publicKey)) {
      return next();
    }
  } catch (e) {
    return next(boom.unauthorized('Signature verification failed.'));
  }

  return next();
};

module.exports = verifySignature;
