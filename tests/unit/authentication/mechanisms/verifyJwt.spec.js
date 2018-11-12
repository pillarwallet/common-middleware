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

  it('should successfully verify a JWT', async () => {
    const result = await verify(token, secret);

    expect(result).toEqual({
      ...payload,
      iat: expect.any(Number),
    });
  });

  it('returns an error object if unable to verify a JWT using an incorrect secret', async () => {
    let response;

    await verify(token, 'incorrect secret')
      .then(decoded => {
        response = decoded;
      })
      .catch(err => {
        response = err;
      });

    expect(response).toEqual(boom.unauthorized('invalid signature'));
  });

  it('returns an error object if unable to verify a JWT using an incorrect token', async () => {
    let response;

    await verify('some.botched.token', secret)
      .then(decoded => {
        response = decoded;
      })
      .catch(err => {
        response = err;
      });

    expect(response).toEqual(boom.unauthorized('invalid token'));
  });

  it('returns an error object if the JWT has expired', async () => {
    let response;
    const expiredToken = jwt.sign(payload, secret, {
      expiresIn: 0,
    });

    await verify(expiredToken, secret)
      .then(decoded => {
        response = decoded;
      })
      .catch(err => {
        response = err;
      });

    expect(response).toEqual(boom.unauthorized('jwt expired'));
  });

  it('returns an error object if missing required `token` parameter', async () => {
    let response;

    await verify()
      .then(decoded => {
        response = decoded;
      })
      .catch(err => {
        response = err;
      });

    expect(response).toEqual(boom.badRequest('No token found.'));
  });

  it('returns an error object if missing required `secretOrPublicKey` parameter', async () => {
    let response;

    await verify('some.random.token')
      .then(decoded => {
        response = decoded;
      })
      .catch(err => {
        response = err;
      });

    expect(response).toEqual(boom.badRequest('No secret or public key found.'));
  });
});
