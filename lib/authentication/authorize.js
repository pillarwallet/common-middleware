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

module.exports = (options = { models: {} }) => {
  const { logger } = options;
  const { Wallet } = options.models;

  if (!logger && !Wallet) {
    throw new Error('logger, models.User and models.Wallet are required');
  }

  return async (req, res, next) => {
    if (req.get('Authorization')) {
      if (!req.userData) {
        return next(boom.unauthorized());
      }

      try {
        let wallet;
        if (req.walletData) {
          /**
           * If walletData was set by a previous middleware,
           * search whether Wallet exists for the userId and walletId provided
           */
          wallet = await Wallet.findOne({
            _id: req.walletData.id,
            userId: req.userData.id,
          });
          if (!wallet) {
            logger.warn(
              { userId: req.userData.id, walletId: req.walletData.id },
              'Wallet record not found',
            );
            return next(boom.unauthorized());
          }
        } else {
          /**
           * Otherwise, find first wallet created
           */
          wallet = await Wallet.findFirstCreated({ userId: req.userData.id });
          if (!wallet) {
            logger.warn({ userId: req.userData.id }, 'Wallet record not found');
            return next(boom.unauthorized());
          }
        }

        req.walletData = wallet;
      } catch (e) {
        const msg = 'Authorize middleware: Database lookup failed';
        logger.error(e, msg);
        return next(boom.internal(msg));
      }
    }

    return next();
  };
};
