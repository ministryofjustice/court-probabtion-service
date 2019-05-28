const logger = require('./log.js')

function get(name, fallback, log) {
  if (process.env[name]) {
    if (log) {
      logger.info(`Env var: ${name} value: ${process.env[name]}`)
    }
    return process.env[name]
  }
  if (fallback !== undefined) {
    if (log) {
      logger.info(`Env var: ${name} value: ${fallback}`)
    }
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

module.exports = {
  apis: {
    courtList: {
      url: get('COURT_LIST_URL', 'http://localhost:8082', true)
    }
  }
}