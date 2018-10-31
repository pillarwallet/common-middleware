const boom = require('boom');
const { verify } = require('@pillarwallet/plr-auth-sdk');

/**
 * @name verifySignature
 * @description This function takes the required information needed to verify
 * a signature and attempts to run a verification process against the signature,
 * public key and data payload.
 *
 * @param {*} signature The incoming signature.
 * @param {*} publicKey The public key to verify with.
 * @param {*} payload The payload to check.
 *
 * @returns {Boolean | Object} The response of the verification process. Returns
 * either a Boolean or an Object with error data.
 */
const verifySignature = (signature, publicKey, payload = {}) => {
  if (!publicKey) {
    return boom.badRequest('No public key found.');
  }

  if (!signature) {
    return boom.unauthorized('No signature found.');
  }

  try {
    const fusedPayload = Object.assign(
      {
        signature,
      },
      payload,
    );

    if (verify(fusedPayload, publicKey)) {
      return true;
    }
  } catch (e) {
    return boom.unauthorized('Signature verification failed.');
  }

  return boom.unauthorized();
};

module.exports = verifySignature;
