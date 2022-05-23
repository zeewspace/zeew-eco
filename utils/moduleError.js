class myError extends Error {
  constructor(msg) {
    super()
    this.message = msg
    this.name = '[Economy Error]'
  }
}

module.exports = myError
