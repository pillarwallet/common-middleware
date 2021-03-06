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
const boom = require('@hapi/boom');
const verifySignature = require('./mechanisms/verifySignature');
const verifyJwt = require('./mechanisms/verifyJwt');
const verifyJwtBlacklist = require('./mechanisms/verifyJwtBlacklist');

/**
 * @name authenticate
 * @description This middleware will attempt to authenticate the request
 * should it be called. This authentication middleware will return a 401
 * by default - unless it can determine a correct signature or token from
 * the incoming request.
 *
 * @param {Object} req The incoming Express request object.
 * @param {Object} res The incoming response object.
 * @param {Function} next The provided next middleware caller.
 *
 * @returns {Function} The provided next middleware caller with possible data
 * set at the first argument.
 */
module.exports = (options = { models: {} }) => async (req, res, next) => {
  const { User, AccessTokenBlacklist } = options.models;
  let token;
  /**
   * Attempt to extract a signature from the headers of the
   * incoming request.
   */
  const signature = req.get('X-API-Signature');

  /**
   * Attempt to extract an Authorization token of the
   * incoming request.
   */
  let authorizationToken = req.get('Authorization');

  /**
   * Fetch the walletData object from the request object which
   * should have been pre-populated at this point.
   */
  const { walletData } = req;

  /**
   * Read the payload from the request, depending on what type of request
   * was being sent to the server.
   */
  const incomingPayload = req.method === 'GET' ? req.query : req.body;

  /**
   * By default - this middleware assumed an unauthenticated state when
   * processing a request.
   */
  let authenticationResult = false;

  /**
   * If we have a signature, let's attempt to verify it against
   * a public key...
   */
  if (signature) {
    /**
     * If no wallet data existed - we cannot continue.
     */
    if (!walletData) {
      return next(boom.badRequest('No wallet data found.'));
    }

    /**
     * Call verify signature with the data ascertained from the
     * previous steps. Verify signature will return either a
     * `true` boolean when verification was valid, or an error object
     * when there was any other result - in this case an error.
     */
    authenticationResult = verifySignature(
      signature,
      walletData.publicKey,
      incomingPayload,
    );

    /**
     * If authentication result is exactly true, then we know that our
     * signature verification was successfull. We can return next to allow
     * Express to continue processing the request.
     */
    if (authenticationResult === true) {
      return next();
    }

    /**
     * If we got to this point, then we have run into an error object.
     * Return it via the next middleware call to be handled by any Express
     * error handlers.
     */
    return next(authenticationResult);
  }

  /**
   * If we have an authorizationToken, then start the process
   * to authorize a JWT.
   */
  if (authorizationToken) {
    /**
     * Did we not find an OAuth public key? Then we just cannot
     * proceed from here.
     */
    if (!options.oAuthPublicKey) {
      return next(boom.internal('No OAuth public key found!'));
    }

    /**
     * Removes "Bearer " from the `authorizationToken` before we
     * continue, should it exist.
     */
    authorizationToken = authorizationToken.replace('Bearer ', '');

    /**
     * Attempt to verify the token against the public key
     * or secret.
     */
    try {
      token = await verifyJwt(authorizationToken, options.oAuthPublicKey);
    } catch (e) {
      /**
       * An error has occured whilst trying to verify the
       * token.
       */
      return next(e);
    }

    try {
      await verifyJwtBlacklist(authorizationToken, AccessTokenBlacklist);
    } catch (e) {
      /**
       * An error has occured whilst trying to verify the token against db
       */
      return next(e);
    }

    try {
      const user = await User.findOne({ registrationId: token.sub });

      if (!user) {
        return next(boom.unauthorized());
      }

      req.userData = user;

      /**
       * Successfully verified.
       */
      return next();
    } catch (e) {
      return next(boom.internal(e.message));
    }
  }

  /**
   * Did we end up here? Just return 401 unauthorized.
   */
  return next(boom.unauthorized());
};
