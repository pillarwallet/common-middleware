const { sign } = require('@pillarwallet/plr-auth-sdk');
const uuid = require('uuid/v4');
// const EC = require('elliptic').ec;

const privateKey =
  'a483e7eb170e6aba4b263af55933ba5108818a07ac2f71e945b2c6c138e600bc';

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
      //
    });
  });
});
