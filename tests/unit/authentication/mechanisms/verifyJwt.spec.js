const jwt = require('jsonwebtoken');
const boom = require('boom');

const verify = require('../../../../lib/authentication/mechanisms/verifyJwt');

describe('The Verify JWT function', () => {
  let token;
  const secret = 'amassivesecret';
  const payload = {
    data: 'test',
  };

  beforeEach(() => {
    token = jwt.sign(payload, secret);
  });

  it('should successfully verify a JWT', () => {
    const result = verify(token, secret);

    expect(result).toEqual({
      ...payload,
      iat: expect.any(Number),
    });
  });

  it('throws an error if unable to verify a JWT using an incorrect secret', () => {
    const response = verify(token, 'incorrect secret');
    expect(response).toEqual(boom.unauthorized('invalid signature'));
  });

  it('throws an error if unable to verify a JWT using an incorrect token', () => {
    const response = verify('some.botched.token', secret);
    expect(response).toEqual(boom.unauthorized('invalid token'));
  });

  it('throws an error if the JWT has expired', () => {
    const expiredToken = jwt.sign(payload, secret, {
      expiresIn: 0,
    });

    const response = verify(expiredToken, secret);
    expect(response).toEqual(boom.unauthorized('jwt expired'));
  });

  it('throws an error if missing required `token` parameter', () => {
    const response = verify();
    expect(response).toEqual(boom.badRequest('No token found.'));
  });

  it('throws an error if missing required `secretOrPublicKey` parameter', () => {
    const response = verify('some.random.token');
    expect(response).toEqual(boom.badRequest('No secret or public key found.'));
  });
});
