const { sign } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
const EC = require('elliptic').ec;
const boom = require('boom');

const authenticationMiddleware = require('../../../lib/authentication/authorize')();
const verifySignature = require('../../../lib/authentication/mechanisms/verifySignature');
const verifyJwt = require('../../../lib/authentication/mechanisms/verifyJwt');

jest.mock('../../../lib/authentication/mechanisms/verifySignature');
jest.mock('../../../lib/authentication/mechanisms/verifyJwt');

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

      next = jest.fn();
    });

    it('should successfully call the verifySignature module when a signature was found in the header', () => {
      const req = {
        get: jest.fn(() => signedPayload.signature),
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

    it('should return a 401 when no signature found', () => {
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

    it('should return a 400 when no wallet data was found', () => {
      const req = {
        get: jest.fn(() => null),
        body: payloadToBeSigned,
      };

      authenticationMiddleware(req, {}, next);

      expect(next).toHaveBeenCalledWith(
        boom.badRequest('No wallet data found.'),
      );
    });

    it('should return a the authentication result when authorisation failed', () => {
      const req = {
        get: jest.fn(() => `${signedPayload.signature}x`), // Demonstration purposes only
        walletData: {
          publicKey: `${publicKey}`,
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

    it('should fall through to a vanilla 401 if no signature found', () => {
      const req = {
        get: jest.fn(() => null),
        walletData: {
          publicKey: `${publicKey}`,
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
    it('should call the verifyJwt module when an Authorize header found', () => {
      const req = {
        get: jest.fn(() => 'Authorization: Bearer: 1a2b3c3d4e5f6g7h8i9j0k'),
      };

      authenticationMiddleware(req, {}, next);

      expect(verifyJwt).toHaveBeenCalled();
    });
  });
});
