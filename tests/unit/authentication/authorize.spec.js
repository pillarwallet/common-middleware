const { sign } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
const EC = require('elliptic').ec;
const boom = require('boom');

const authenticationMiddleware = require('../../../lib/authentication/authorize');
const verifySignature = require('../../../lib/authentication/mechanisms/verifySignature');

jest.mock('../../../lib/authentication/mechanisms/verifySignature');

const ecSecp256k1 = new EC('secp256k1');
const keys = ecSecp256k1.genKeyPair();
const privateKey = keys.getPrivate().toString('hex');
const publicKey = keys.getPublic().encode('hex');

describe('The Authentication Middleware', () => {
  let payloadToBeSigned;
  let signedPayload;
  let next;

  beforeEach(() => {
    payloadToBeSigned = {
      something: uuid(),
      else: uuid(),
    };
    signedPayload = sign(payloadToBeSigned, privateKey);

    next = jest.fn();
  });

  afterEach(() => {
    next.mockClear();
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

    expect(next).toHaveBeenCalledWith(boom.badRequest('No wallet data found.'));
  });
});
