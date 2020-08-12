const env = process.env.NODE_ENV || 'production'
const config = require('./' + env)
module.exports = config
