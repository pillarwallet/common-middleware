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
const accessControlHeaders = require('../../lib/accessControlHeaders');

describe('Access Control Headers middleware', () => {
  const req = {};
  const res = {
    header: jest.fn(),
  };
  const next = jest.fn();
  let middleware;

  beforeEach(() => {
    middleware = accessControlHeaders();
  });

  afterEach(() => {
    res.header.mockClear();
    next.mockClear();
  });

  it('exports a function', () => {
    expect(typeof accessControlHeaders).toBe('function');
  });

  it('returns a middlware function', () => {
    expect(typeof middleware).toBe('function');
    expect(middleware).toHaveLength(3);
  });

  it('sets headers', () => {
    middleware(req, res, next);

    expect(res.header.mock.calls).toEqual([
      ['Access-Control-Allow-Origin', '*'],
      [
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      ],
    ]);
  });

  it('calls next', () => {
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
