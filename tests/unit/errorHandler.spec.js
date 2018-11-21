const boom = require('boom');
const errorHandler = require('../../lib/errorHandler');

describe('Error handler', () => {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = {};
  const logger = {};

  beforeEach(() => {
    logger.error = jest.fn();
    logger.info = jest.fn();
  });

  afterEach(() => {
    res.status.mockClear();
    res.json.mockClear();
  });

  it('is a function', () => {
    expect(typeof errorHandler).toBe('function');
  });

  it('returns error handling middleware (accepts 4 parameters)', () => {
    const middleware = errorHandler();
    expect(typeof middleware).toBe('function');
    expect(middleware).toHaveLength(4);
  });

  describe('middleware', () => {
    let middleware;

    describe('when configured with a logger', () => {
      beforeEach(() => {
        middleware = errorHandler({ logger });
      });

      describe('for server errors (5xx)', () => {
        it('logs at the error level', () => {
          const err = boom.internal('Secret error');

          middleware(err, req, res, next);

          expect(logger.error).toBeCalledWith(
            { err },
            'Error handler server error',
          );
        });

        it('does not throw an error when not configured with an error method', () => {
          delete logger.error;

          middleware = errorHandler({ logger });

          expect(() =>
            middleware(boom.internal(), req, res, next),
          ).not.toThrow();
        });
      });

      describe('for client errors (4xx)', () => {
        it('logs at the info level', () => {
          const err = boom.badRequest('Client error');

          middleware(err, req, res, next);

          expect(logger.info).toBeCalledWith(
            { err },
            'Error handler client error',
          );
        });

        it('does not throw an error when not configured with an info method', () => {
          delete logger.info;

          middleware = errorHandler({ logger });

          expect(() =>
            middleware(boom.badRequest(), req, res, next),
          ).not.toThrow();
        });
      });
    });

    describe('responses', () => {
      middleware = errorHandler();

      /**
       * JSend spec: https://labs.omniti.com/labs/jsend
       */
      it('responds with a JSend JSON response object', () => {
        const err = boom.badRequest('Missing parameters');
        middleware(err, req, res, next);

        expect(res.status).toBeCalledWith(400);
        expect(res.json).toBeCalledWith({
          status: 'fail',
          data: {
            message: 'Missing parameters',
          },
        });
      });

      it('exposes 400 range error messages', () => {
        const message = 'This is useful client feedback.';
        const err = boom.badRequest(message);

        middleware(err, req, res, next);

        expect(res.json.mock.calls[0][0].data.message).toBe(message);
      });

      it('uses generic messages for 500 range errors', () => {
        const err = boom.internal('Error message for logging purposes');

        middleware(err, req, res, next);

        expect(res.status).toBeCalledWith(500);
        expect(res.json).toBeCalledWith({
          status: 'fail',
          data: {
            message: 'Internal Server Error',
          },
        });
      });
    });
  });
});
