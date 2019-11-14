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
const boom = require('boom');

/**
 * @name verify
 * @description Attempts to verify the token against the db.
 *
 * @param {String} token The incoming token to verify
 * @param {Object} model AccessTokenBlacklist schema
 *
 * @returns {Object<boom>}
 */
const verify = async (token, model) => {
  try {
    const accessToken = await model.findOne({ accessToken: token });
    if (accessToken) {
      return Promise.reject(boom.unauthorized());
    }
    return Promise.resolve('Access token valid');
  } catch (e) {
    return Promise.reject(boom.unauthorized(e.message));
  }
};

module.exports = verify;
