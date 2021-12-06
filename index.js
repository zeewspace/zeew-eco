const mongoose = require("mongoose");
class Options {
  /**
   * 
   * @param {String} URI Mongodb URL
   * @example Options("mongodb://localhost:27017/zeew")
   */
  constructor(URI) {
    this._init(URI);
  }

  _init(URI) {
    mongoose
      .connect(URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("[══════ Zeew Economia ═══════]");
    })
      .catch((e) =>
        console.log("[══════ Zeew Economia: " + e.message + " ═══════]")
      );
  }
}


/**
 * @export Options Clase para configurar la URL de la base de datos de mongodb
 * @export Economia Clase con los metodos de la Economia
 * @export Tienda Clase con los metodos de la Tienda
 * @export Inventario Clase con los metodos de la Inventario
 * @export Banco Clase con los metodos de la Banco
 */
module.exports = {
    Options,
    Economia: require('./src/economia'),
    Tienda: require('./src/tienda'),
    Inventario: require('./src/inventario'),
    Banco: require('./src/banco'),
}