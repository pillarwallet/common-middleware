const boom = require('boom');

module.exports = (options = { models: {} }) => {
  const { logger } = options;
  const { User, Wallet } = options.models;

  if (!logger && !User && !Wallet) {
    throw new Error('logger, models.User and models.Wallet are required');
  }

  return async (req, res, next) => {
    if (req.get('Authorization')) {
      if (!req.username) {
        return next(boom.unauthorized());
      }

      try {
        const user = await User.findOne({ username: req.username });
        if (!user) {
          logger.warn({ username: req.username }, 'User record not found');
          return next(boom.unauthorized());
        }

        const wallet = await Wallet.findOne({ userId: user.id });
        if (!wallet) {
          logger.warn({ userId: user.id }, 'Wallet record not found');
          return next(boom.unauthorized());
        }

        req.userData = user;
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
