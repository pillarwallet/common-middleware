const { sign } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
const EC = require('elliptic').ec;
const boom = require('boom');

const authenticationMiddlewareSource = require('../../../lib/authentication/authorize');

const verifySignature = require('../../../lib/authentication/mechanisms/verifySignature');
const verifyJwt = require('../../../lib/authentication/mechanisms/verifyJwt');

jest.mock('../../../lib/authentication/mechanisms/verifySignature');
jest.mock('../../../lib/authentication/mechanisms/verifyJwt');

const authenticationMiddleware = authenticationMiddlewareSource({
  oAuthPublicKey: 'abc123',
});
const authenticationMiddlewareNoPublicKey = authenticationMiddlewareSource();

const ecSecp256k1 = new EC('secp256k1');
const keys = ecSecp256k1.genKeyPair();
const privateKey = keys.getPrivate().toString('hex');
const publicKey = keys.getPublic().encode('hex');

describe('The Authentication Middleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
  });

  afterEach(() => {
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
    });
  });

  describe('When authorising a token', () => {
    beforeEach(() => {
      verifyJwt.mockClear();
    });

    it('fires the next function when verify funtion resolves successfully', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Authorization: Bearer: jk3b4jk32b4kb24jb2kb4hjk23b4hk23';
          }

          return null;
        }),
        oAuthPublicKey: 'somemassivesecret',
        walletData: {
          publicKey,
        },
      };

      verifyJwt.mockImplementationOnce(() => Promise.resolve());

      await authenticationMiddleware(req, {}, next);

      expect(next).toHaveBeenCalledWith(); // Just calls next().
    });

    it('calls the verifyJwt module when an Authorization header found', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Authorization: Bearer: 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        oAuthPublicKey: 'somethingsecret',
        walletData: {
          publicKey,
        },
      };

      await authenticationMiddleware(req, {}, next);

      expect(verifyJwt).toHaveBeenCalled();
    });

    it('does not call the verifyJwt module when missing the `oAuthPublicKey` property', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Authorization: Bearer: 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
      };

      await authenticationMiddlewareNoPublicKey(req, {}, next);

      expect(verifyJwt).not.toHaveBeenCalled();
    });

    it('returns a 500 message when missing the `oAuthPublicKey` property', async () => {
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Authorization: Bearer: 1a2b3c3d4e5f6g7h8i9j0k';
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
    });

    it('fires the next function with an error when verifyJwt throws', async () => {
      const unauthorizedError = Promise.reject(
        boom.unauthorized('Not allowed!'),
      );
      const req = {
        get: jest.fn(key => {
          if (key === 'Authorization') {
            return 'Authorization: Bearer: 1a2b3c3d4e5f6g7h8i9j0k';
          }

          return null;
        }),
        walletData: {
          publicKey,
        },
      };

      verifyJwt.mockImplementationOnce(() => unauthorizedError);

      await authenticationMiddleware(req, {}, next);

      expect(next.mock.calls[0][0]).toEqual('Not allowed!');
    });
  });
});
