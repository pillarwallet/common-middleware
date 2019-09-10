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
const networkHeader = require('../../lib/networkHeader');

describe('Network Header middleware', () => {
  let req;
  const res = {};
  const next = jest.fn();
  let middleware;

  beforeEach(() => {
    middleware = networkHeader();
    req = {
      get: jest.fn().mockReturnValue('Dev'),
    };
  });

  afterEach(() => {
    req.get.mockClear();
    next.mockClear();
  });

  it('exports a function', () => {
    expect(typeof networkHeader).toBe('function');
  });

  it('returns a middlware function', () => {
    expect(typeof middleware).toBe('function');
    expect(middleware).toHaveLength(3);
  });

  it('pass the headers checks', () => {
    middleware(req, res, next);

    expect(req.get.mock.calls[0][0]).toEqual('Network');
  });

  it('calls next', () => {
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  describe('Missing network header', () => {
    beforeEach(() => {
      req = {
        get: jest.fn().mockReturnValue(null),
      };
      middleware(req, res, next);
    });

    it('calls next with a bad request error', () => {
      const err = next.mock.calls[0][0];

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Missing network header in the request.');
      expect(err.output.statusCode).toBe(400);
    });
  });

  describe('invalid network header', () => {
    beforeEach(() => {
      req = {
        get: jest.fn().mockReturnValue('INVALID'),
      };
      middleware(req, res, next);
    });

    it('calls next with a bad request error', () => {
      const err = next.mock.calls[0][0];

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Invalid network set in the request.');
      expect(err.output.statusCode).toBe(400);
    });
  });
});
