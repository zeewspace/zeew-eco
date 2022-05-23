const moduleError = require('../utils/moduleError.js'),
      sqlp = require('sqliteplus'),
      pathType = require('./functions/pathType.js')

class Economy {
  constructor(db) {
    db = pathType(db)

    console.log(db)
  }
}

module.exports = Economy
