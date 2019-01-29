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
const { sign } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
const EC = require('elliptic').ec;
const boom = require('boom');
const jwt = require('jsonwebtoken');

const authenticationMiddlewareSource = require('../../../lib/authentication/authenticate');

const verifySignature = require('../../../lib/authentication/mechanisms/verifySignature');
const verifyJwt = require('../../../lib/authentication/mechanisms/verifyJwt');

jest.mock('../../../lib/authentication/mechanisms/verifySignature');
jest.mock('../../../lib/authentication/mechanisms/verifyJwt');

const authenticationMiddlewareNoPublicKey = authenticationMiddlewareSource();

const ecSecp256k1 = new EC('secp256k1');
const keys = ecSecp256k1.genKeyPair();
const privateKey = keys.getPrivate().toString('hex');
const publicKey = keys.getPublic().encode('hex');

describe('The Authentication Middleware', () => {
  const User = {
    findOne: jest.fn(),
  };
  const authenticationMiddleware = authenticationMiddlewareSource({
    models: { User },
    oAuthPublicKey: 'abc123',
  });
  let next;

  User.findOne.mockImplementation(() => Promise.resolve({}));

  beforeEach(() => {
    next = jest.fn();
  });

  afterEach(() => {
    User.findOne.mockClear();
    next.mockClear();
  });

  describe('When authorising a signature', () => {
    let payloadToBeSigned;
    let signedPayload;

    beforeEach(() => {
      payloadToBeSigned = {
        something: uuid(),
        else: uuid(),
      };
      signedPayload = sign(payloadToBeSigned, privateKey);
    });

    it('successfully calls the verifySignature module when a signature is found in the header', () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'X-API-Signature') {
            return signedPayload.signature;
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
        body: payloadToBeSigned,
      };

      authenticationMiddleware(req, {}, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeUndefined();
      expect(verifySignature).toHaveBeenCalledWith(
        signedPayload.signature,
        publicKey,
        payloadToBeSigned,
      );
      expect(verifyJwt).not.toHaveBeenCalled();
    });

    it('returns a 401 when no signature found', () => {
      const req = {
        get: jest.fn(() => null),
        walletData: {
          publicKey,
        },
        body: payloadToBeSigned,
      };

      authenticationMiddleware(req, {}, next);

      expect(next).toHaveBeenCalledWith(boom.unauthorized());
      expect(verifyJwt).not.toHaveBeenCalled();
    });

    it('returns a 400 when no wallet data was found', () => {
      const req = {
        get: jest.fn(() => null),
        body: payloadToBeSigned,
      };

      authenticationMiddleware(req, {}, next);

      expect(next).toHaveBeenCalledWith(
        boom.badRequest('No wallet data found.'),
      );
      expect(verifyJwt).not.toHaveBeenCalled();
    });

    it('returns a the authentication result when authorisation failed', () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'X-API-Signature') {
            return `${signedPayload.signature}x`; // Demonstration purposes only
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
        body: payloadToBeSigned,
      };
      const unauthorizedError = boom.unauthorized(
        'Signature verification failed.',
      );

      verifySignature.mockImplementationOnce(() => unauthorizedError);

      authenticationMiddleware(req, {}, next);

      expect(next.mock.calls[0][0]).toEqual(unauthorizedError);
      expect(verifyJwt).not.toHaveBeenCalled();
    });

    it('falls through to a vanilla 401 if no signature found', () => {
      const req = {
        get: jest.fn(() => null),
        walletData: {
          publicKey,
        },
        body: payloadToBeSigned,
      };
      const unauthorizedError = boom.unauthorized();

      verifySignature.mockImplementationOnce(() => unauthorizedError);

      authenticationMiddleware(req, {}, next);

      expect(next.mock.calls[0][0]).toEqual(unauthorizedError);
      expect(verifyJwt).not.toHaveBeenCalled();
    });
  });

  describe('When verifying a token', () => {
    beforeEach(() => {
      verifyJwt.mockClear();
      verifySignature.mockClear();
    });

    it('fires the next function when verify funtion resolves successfully', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Bearer jk3b4jk32b4kb24jb2kb4hjk23b4hk23';
          }

          return null;
        }),
        oAuthPublicKey: 'somemassivesecret',
        walletData: {
          publicKey,
        },
      };

      verifyJwt.mockImplementationOnce(() => Promise.resolve({ uuid: 'uuid' }));

      await authenticationMiddleware(req, {}, next);

      expect(next).toHaveBeenCalledWith(); // Just calls next().
      expect(verifySignature).not.toHaveBeenCalled();

      // Ensure that "Bearer " was removed.
      expect(verifyJwt).toHaveBeenCalledWith(
        'jk3b4jk32b4kb24jb2kb4hjk23b4hk23',
        'abc123',
      );
    });

    it('calls the verifyJwt module when an Authorization header found', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Bearer 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        oAuthPublicKey: 'somethingsecret',
        walletData: {
          publicKey,
        },
      };

      await authenticationMiddleware(req, {}, next);

      // Ensure that "Bearer " was removed.
      expect(verifyJwt).toHaveBeenCalledWith(
        '1a2b3c3d4e5f6g7h8i9j0k',
        'abc123',
      );
      expect(verifySignature).not.toHaveBeenCalled();
    });

    describe('user lookup', () => {
      const registrationId = 'abc-123';
      const user = {
        id: 'def-456',
        registrationId,
        username: 'username',
      };
      const token = jwt.sign({ sub: registrationId }, 'abc123');
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return `Bearer ${token}`;
          }
          return null;
        }),
        walletData: {},
      };
      const setUserData = jest.fn();

      Object.defineProperty(req, 'userData', {
        set: setUserData,
      });

      beforeEach(() => {
        verifyJwt.mockImplementationOnce((...args) =>
          Promise.resolve(
            require.requireActual(
              '../../../lib/authentication/mechanisms/verifyJwt',
            )(...args),
          ),
        );
      });

      afterEach(() => {
        setUserData.mockClear();
        verifyJwt.mockReset();
      });

      it('adds user data to request object when JWT verification is successful', async () => {
        User.findOne.mockImplementationOnce(() => Promise.resolve(user));

        await authenticationMiddleware(req, {}, next);

        expect(User.findOne).toHaveBeenCalledWith({ registrationId });

        expect(setUserData.mock.calls[0][0]).toBe(user);
        expect(next).toHaveBeenCalledWith();

        // Check call order
        const [verifyCallIdx] = verifyJwt.mock.invocationCallOrder;
        const [setUserDataIdx] = setUserData.mock.invocationCallOrder;
        const [nextCallIdx] = next.mock.invocationCallOrder;

        expect(verifyCallIdx).toBeLessThan(setUserDataIdx);
        expect(setUserDataIdx).toBeLessThan(nextCallIdx);
      });

      it('calls next with an unauthorized error when user cannot be found', async () => {
        User.findOne.mockImplementationOnce(() => Promise.resolve(null));

        await authenticationMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);

        const [err] = next.mock.calls[0];
        expect(err).toBeInstanceOf(Error);
        expect(err.output.statusCode).toBe(401);
      });

      it('calls next with an internal server error when user lookup fails', async () => {
        User.findOne.mockImplementationOnce(() =>
          Promise.reject(new Error('Lookup failed')),
        );

        await authenticationMiddleware(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);

        const [err] = next.mock.calls[0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Lookup failed');
        expect(err.output.statusCode).toBe(500);
      });
    });

    it('does not call the verifyJwt module when missing the `oAuthPublicKey` property', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Bearer 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
      };

      await authenticationMiddlewareNoPublicKey(req, {}, next);

      expect(verifyJwt).not.toHaveBeenCalled();
      expect(verifySignature).not.toHaveBeenCalled();
    });

    it('returns a 500 message when missing the `oAuthPublicKey` property', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Bearer 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
      };

      await authenticationMiddlewareNoPublicKey(req, {}, next);

      expect(next.mock.calls[0][0]).toEqual(
        boom.internal('No OAuth public key found!'),
      );
      expect(verifySignature).not.toHaveBeenCalled();
    });

    it('fires the next function with an error when verifyJwt throws', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Bearer 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
      };

      verifyJwt.mockImplementationOnce(() =>
        Promise.reject(boom.unauthorized('Not allowed!')),
      );

      await authenticationMiddleware(req, {}, next);

      expect(next.mock.calls[0][0]).toEqual(boom.unauthorized('Not allowed!'));
      expect(verifySignature).not.toHaveBeenCalled();
    });
  });
});
