/*
Copyright (C) 2019 Stiftung Pillar Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
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
  if (!signature && !publicKey) {
    return boom.badRequest(
      'No public key or signature found. Both of these are required to verify a payload against a signature.',
    );
  }

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
