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
        const wallet = await Wallet.findOne({ userId: req.userData.id });
        if (!wallet) {
          logger.warn({ userId: req.userData.id }, 'Wallet record not found');
          return next(boom.unauthorized());
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
