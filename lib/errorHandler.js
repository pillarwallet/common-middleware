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

  if (logger) {
    /**
     * This expects a Bunyan logger with an error serialiser
     * https://github.com/trentm/node-bunyan#serializers
     */
    if (status >= 500 && logger.error) {
      logger.error({ err }, 'Error handler server error');
    } else if (logger.info) {
      logger.info({ err }, 'Error handler client error');
    }
  }

  res.status(status).json({
    status: 'fail',
    data: {
      message,
    },
  });
};

module.exports = errorHandler;
