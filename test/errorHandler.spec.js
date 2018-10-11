const boom = require('boom');
const errorHandler = require('../lib/errorHandler');

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

  it('logs the error payload when configured with a logger', () => {
    const err = boom.internal('Secret error');

    const middleware = errorHandler({ logger });
    middleware(err, req, res, next);

    expect(logger.error).toBeCalledWith({ err }, 'Error handler error');
  });

  it('does not throw an error when not configured with a logger with an error method', () => {
    delete logger.error;
    const middleware = errorHandler({ logger });
    expect(() => middleware(boom.internal(), req, res, next)).not.toThrow();
  });

  describe('middleware', () => {
    let middleware;

    beforeEach(() => {
      middleware = errorHandler();
    });
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
