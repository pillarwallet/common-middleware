const { sign } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
const EC = require('elliptic').ec;
const boom = require('boom');
const verify = require('../../../../lib/authentication/mechanisms/verifySignature');

const ecSecp256k1 = new EC('secp256k1');

const keys = ecSecp256k1.genKeyPair();
const privateKey = keys.getPrivate().toString('hex');
const publicKey = keys.getPublic().encode('hex');

describe('The Verify Signature function', () => {
  let signedPayload;
  let payloadToBeSigned;

  beforeEach(() => {
    payloadToBeSigned = {
      something: uuid(),
      else: uuid(),
    };
    signedPayload = sign(payloadToBeSigned, privateKey);
  });
  describe('when signing a payload', () => {
    it('should successfully generate a signature object', () => {
      expect(signedPayload.signature).toHaveLength(128);
      expect(signedPayload.recoveryParam).toEqual(expect.anything());
    });
  });

  describe('when verifying a payload', () => {
    it('should successfully verify a payload when valid data supplied', () => {
      const verificationResult = verify(
        signedPayload.signature,
        publicKey,
        payloadToBeSigned,
      );

      expect(verificationResult).toBe(true);
    });

    it('should fail to verify a payload when invalid signature provided', () => {
      const verificationResult = verify(
        'some signature',
        publicKey,
        payloadToBeSigned,
      );

      expect(verificationResult).toEqual(
        boom.unauthorized('Signature verification failed.'),
      );
    });

    it('should fail to verify a payload when invalid data provided', () => {
      const incorrectPayload = {
        ...payloadToBeSigned,
        rogueProperty: true,
      };

      const verificationResult = verify(
        signedPayload,
        publicKey,
        incorrectPayload,
      );

      expect(verificationResult).toEqual(
        boom.unauthorized('Signature verification failed.'),
      );
    });

    it('should fail when missing required public key parameter', () => {
      const verificationResult = verify(signedPayload);

      expect(verificationResult).toEqual(
        boom.badRequest('No public key found.'),
      );
    });

    it('should fail when missing required signature parameter', () => {
      const verificationResult = verify(undefined, signedPayload);

      expect(verificationResult).toEqual(
        boom.badRequest('No signature found.'),
      );
    });

    it('should fail when missing all parameters', () => {
      const verificationResult = verify();

      expect(verificationResult).toEqual(
        boom.badRequest(
          'No public key or signature found. Both of these are required to verify a payload against a signature.',
        ),
      );
    });
  });
});
