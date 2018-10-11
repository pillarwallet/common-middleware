/**
 * @name errorHandler
 * @description Error-handling middleware that handles and accepts Boom error objects
 * @param options {Object}
 * @param options.logger Bunyan logger with an error method
 *
 * @returns {Function}
 * @param err
 * @param req
 * @param res
 * @param next
 */

/* eslint-disable-next-line no-unused-vars */
const errorHandler = ({ logger } = {}) => (err, req, res, next) => {
  const status = err.output.statusCode;
  const message = status < 500 ? err.message : err.output.payload.error;

  if (logger && logger.error) {
    /**
     * This expects a Bunyan logger with an error serialiser
     * https://github.com/trentm/node-bunyan#serializers
     */
    logger.error({ err }, 'Error handler error');
  }

  res.status(status).json({
    status: 'fail',
    data: {
      message,
    },
  });
};

module.exports = errorHandler;
