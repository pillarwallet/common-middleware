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
