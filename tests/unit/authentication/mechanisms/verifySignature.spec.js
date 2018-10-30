const { sign, verify } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
const EC = require('elliptic').ec;

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
      const fusedPayload = {
        ...payloadToBeSigned,
        signature: signedPayload.signature,
      };

      const verificationResult = verify(fusedPayload, publicKey);

      expect(verificationResult).toBe(true);
    });

    it('should fail to verify a payload when invalid signature provided', () => {
      const fusedPayload = {
        ...payloadToBeSigned,
        signature: 'something else',
      };

      expect(() => {
        verify(fusedPayload, publicKey);
      }).toThrow();
    });

    it('should fail to verify a payload when invalid data provided', () => {
      const fusedPayload = {
        ...payloadToBeSigned,
        something: true,
        signature: signedPayload.signature,
      };

      const verificationResult = verify(fusedPayload, publicKey);

      expect(verificationResult).toBe(false);
    });
  });
});
