const boom = require('boom');
const authorize = require('../../../lib/authentication/authorize');

describe('Authorize', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  const User = {
    findOne: jest.fn(),
  };
  const Wallet = {
    findOne: jest.fn(),
  };
  const options = {
    logger,
    models: {
      User,
      Wallet,
    },
  };

  afterEach(() => {
    logger.error.mockClear();
    logger.warn.mockClear();
  });

  it('is a function', () => {
    expect(typeof authorize).toBe('function');
  });

  it('throws an error when not constructed with logger and models', () => {
    expect.assertions(2);

    try {
      authorize();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe(
        'logger, models.User and models.Wallet are required',
      );
    }
  });

  it('returns middleware', () => {
    expect(authorize(options)).toHaveLength(3);
  });

  describe('middleware', () => {
    const userId = 'user-id';
    const username = 'username';
    const user = {
      id: userId,
      username,
    };
    const wallet = {
      id: 'wallet-id',
      userId,
    };
    const res = {};
    const next = jest.fn();
    const middleware = authorize(options);

    let req;

    beforeEach(() => {
      req = {
        get: key => {
          if (key === 'Authorization') {
            return 'Bearer foo';
          }
          return undefined;
        },
        username,
      };
      User.findOne.mockImplementation(() => Promise.resolve(user));
      Wallet.findOne.mockImplementation(() => Promise.resolve(wallet));
    });

    afterEach(() => {
      next.mockClear();
      User.findOne.mockClear();
      Wallet.findOne.mockClear();
    });

    it('calls next', async () => {
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('adds `userData` to the request object', async () => {
      await middleware(req, res, next);

      expect(req.userData).toBe(user);
    });

    it('adds `walletData` to the request object', async () => {
      await middleware(req, res, next);

      expect(req.walletData).toBe(wallet);
    });

    it('replaces `walletData` on the request object when it exists', async () => {
      req.walletData = {
        id: 'another-wallet-id',
        userId: 'another-user-id',
      };

      await middleware(req, res, next);

      expect(req.walletData).toBe(wallet);
    });

    it('calls next when `Authorization` header is not set', async () => {
      req.get = () => null;

      middleware(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it('calls next with an unauthorized error when `Authorization` header is set and there is no `username`', () => {
      /**
       * `username` should be set by authenticate middleware
       */
      req = {
        get: key => {
          if (key === 'Authorization') {
            return 'Bearer foo';
          }
          return undefined;
        },
      };

      middleware(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(boom.unauthorized());
    });

    describe('when user cannot be found', () => {
      beforeEach(async () => {
        User.findOne.mockImplementationOnce(() => Promise.resolve(null));

        await middleware(req, res, next);
      });

      it('logs a warning', () => {
        expect(logger.warn).toHaveBeenCalledWith(
          { username },
          'User record not found',
        );
      });

      it('calls next with an unauthorized error', async () => {
        expect(User.findOne).toBeCalledTimes(1);
        expect(next).toBeCalledTimes(1);
        expect(next).toHaveBeenCalledWith(boom.unauthorized());
      });
    });

    describe('when wallet cannot be found', () => {
      beforeEach(async () => {
        Wallet.findOne.mockImplementationOnce(() => Promise.resolve(null));

        await middleware(req, res, next);
      });

      it('logs a warning', () => {
        expect(logger.warn).toHaveBeenCalledWith(
          { userId },
          'Wallet record not found',
        );
      });

      it('calls next with an unauthorized error', async () => {
        expect(Wallet.findOne).toBeCalledTimes(1);
        expect(next).toBeCalledTimes(1);
        expect(next).toHaveBeenCalledWith(boom.unauthorized());
      });
    });

    describe('when database lookup fails', () => {
      beforeEach(async () => {
        User.findOne.mockImplementationOnce(() =>
          Promise.reject(new Error('User lookup failed')),
        );

        await middleware(req, res, next);
      });

      it('logs error', () => {
        expect(logger.error).toHaveBeenCalledWith(
          new Error('User lookup failed'),
          'Authorize middleware: Database lookup failed',
        );
      });

      it('calls next with an internal server error error', async () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenLastCalledWith(
          boom.internal('Authorize middleware: Database lookup failed'),
        );
      });
    });
  });
});
