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
const authorize = require('../../../lib/authentication/authorize');

describe('Authorize', () => {
  const Wallet = {
    findOne: jest.fn(),
    findFirstCreated: jest.fn(),
  };
  const options = {
    models: {
      Wallet,
    },
  };

  it('is a function', () => {
    expect(typeof authorize).toBe('function');
  });

  it('throws an error when not constructed with models', () => {
    expect.assertions(2);

    try {
      authorize();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('models.User and models.Wallet are required');
    }
  });

  it('returns middleware', () => {
    expect(authorize(options)).toHaveLength(3);
  });

  describe('middleware', () => {
    const userId = 'user-id';
    const user = {
      id: userId,
      username: 'username',
    };
    const wallet = {
      id: 'wallet-id',
      userId,
      disabled: false,
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
        userData: user,
      };

      Wallet.findOne.mockImplementationOnce(() => Promise.resolve(wallet));
      Wallet.findFirstCreated.mockImplementation(() => Promise.resolve(wallet));
    });

    afterEach(() => {
      next.mockClear();
      Wallet.findOne.mockReset();
      Wallet.findFirstCreated.mockReset();
    });

    it('calls next', async () => {
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('adds `walletData` to the request object', async () => {
      await middleware(req, res, next);

      expect(Wallet.findFirstCreated).toBeCalledWith({
        userId: req.userData.id,
      });
      expect(req.walletData).toBe(wallet);
    });

    it('replaces `walletData` on the request object when it exists', async () => {
      req.walletData = {
        id: 'wallet-id',
        userId,
        disabled: false,
      };

      Wallet.findOne.mockReset();
      Wallet.findOne.mockImplementation(() => Promise.resolve(wallet));

      await middleware(req, res, next);

      expect(Wallet.findOne).toBeCalledWith({
        _id: req.walletData.id,
        userId: req.userData.id,
        disabled: false,
      });

      expect(req.walletData).toBe(wallet);
    });

    it('calls next when `Authorization` header is not set', async () => {
      req.get = () => null;

      middleware(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it('calls next with an unauthorized error when `Authorization` header is set and there is no `userData`', () => {
      /**
       * `userData` should be set by authenticate middleware
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

    it('calls next with an unauthorized error when walletData.id does not exist', async () => {
      /**
       * `walletData` should be set by [getWallet, authenticate] middleware
       */
      req = {
        get: key => {
          if (key === 'Authorization') {
            return 'Bearer foo';
          }
          return undefined;
        },
        userData: user,
        walletData: {
          id: 'random-id',
        },
      };

      Wallet.findOne.mockReset();
      Wallet.findOne.mockImplementation(() => Promise.resolve(null));

      await middleware(req, res, next);

      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(boom.unauthorized());
    });

    describe('when wallet cannot be found', () => {
      beforeEach(async () => {
        Wallet.findFirstCreated.mockImplementation(() => Promise.resolve(null));

        await middleware(req, res, next);
      });

      it('calls next with an unauthorized error', async () => {
        expect(Wallet.findFirstCreated).toBeCalledTimes(1);
        expect(next).toBeCalledTimes(1);
        expect(next).toHaveBeenCalledWith(boom.unauthorized());
      });
    });

    describe('when `walletData` on the request object is disabled', () => {
      beforeEach(async () => {
        req.walletData = {
          id: 'wallet-id',
          userId,
          disabled: true,
        };
        Wallet.findOne.mockReset();
        Wallet.findOne.mockImplementation(() => Promise.resolve(null));

        await middleware(req, res, next);
      });

      it('calls next with an unauthorized error', async () => {
        expect(Wallet.findOne).toBeCalledTimes(1);
        expect(next).toBeCalledTimes(1);
        expect(next).toHaveBeenCalledWith(boom.unauthorized());
      });
    });

    describe('when database lookup fails', () => {
      beforeEach(async () => {
        Wallet.findFirstCreated.mockImplementation(() =>
          Promise.reject(new Error('Wallet lookup failed')),
        );

        await middleware(req, res, next);
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
