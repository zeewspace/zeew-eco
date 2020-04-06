var colors = require('colors');
class ZeewError extends Error {
    /**
    * @param {string} error Error en la función
    * @private
    */
    constructor(error) {
      super()
    
      this.name = "[Zeew.Economia] ".red;
    /**
    * Error recibido por el punto final
    * @type {string} 
    */
      this.message = error;
    }
  }
module.exports = {ZeewError};