const boom = require('boom');
const verifySignature = require('./mechanisms/verifySignature');

/**
 * @name authorize
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
module.exports = () => (req, res, next) => {
  /**
   * Attempt to extract a signature from the headers of the
   * incoming request.
   */
  const signature = req.get('X-API-Signature');

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
   * If no wallet data existed - we cannot continue.
   */
  if (!walletData) {
    return next(boom.badRequest('No wallet data found.'));
  }

  /**
   * If we have a signature, let's attempt to verify it against
   * a public key...
   */
  if (signature) {
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
   * Did we end up here? Just return 401 unauthorized.
   */
  return next(boom.unauthorized());
};
