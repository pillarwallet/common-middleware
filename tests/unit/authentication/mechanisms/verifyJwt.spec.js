const jwt = require('jsonwebtoken');

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
});
