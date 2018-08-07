const accessControlHeaders = require('../lib/accessControlHeaders');

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
