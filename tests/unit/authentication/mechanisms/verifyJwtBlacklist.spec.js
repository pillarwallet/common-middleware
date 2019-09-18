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
const verifyJwtBlacklist = require('../../../../lib/authentication/mechanisms/verifyJwtBlacklist');

describe('The Verify JWT Blacklist function', () => {
  let token;

  const AccessTokenBlacklist = {
    findOne: jest.fn(),
  };

  const logger = {
    error: jest.fn(),
  };

  beforeEach(() => {
    AccessTokenBlacklist.findOne.mockImplementation(() =>
      Promise.resolve(null),
    );
    token = 'testToken';
  });

  afterEach(() => {
    AccessTokenBlacklist.findOne.mockClear();
  });

  it('should successfully verify a JWT against db', async () => {
    const result = await verifyJwtBlacklist(
      token,
      AccessTokenBlacklist,
      logger,
    );

    expect(result).toEqual('Access token valid');
  });

  describe('When token is blacklisted', () => {
    beforeEach(() => {
      AccessTokenBlacklist.findOne.mockImplementation(() =>
        Promise.resolve({}),
      );
    });

    it('returns an error object if token is invalid', async () => {
      try {
        await verifyJwtBlacklist(token, AccessTokenBlacklist, logger);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Unauthorized');
        expect(err.output.statusCode).toBe(401);
      }
    });

    it('logs error if logger is defined', async () => {
      try {
        await verifyJwtBlacklist(token, AccessTokenBlacklist, logger);
      } catch (err) {
        expect(logger.error).toHaveBeenCalledWith('Access token invalidated');
      }
    });
  });

  describe('when token lookup fails', () => {
    const dbErr = new Error('Token lookup failed.');

    beforeEach(async () => {
      AccessTokenBlacklist.findOne.mockReset();
      AccessTokenBlacklist.findOne.mockRejectedValue(dbErr);
    });

    it('returns an error object if token is invalid', async () => {
      try {
        await verifyJwtBlacklist(token, AccessTokenBlacklist, logger);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Token lookup failed.');
        expect(err.output.statusCode).toBe(401);
      }
    });
  });
});
