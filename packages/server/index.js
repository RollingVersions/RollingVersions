if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
}

module.exports = require('./lib/server').default;
