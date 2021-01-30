const mongoose = require("mongoose");
class Options {
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



module.exports = {
    Options,
    Economia: require('./src/economia'),
    Tienda: require('./src/tienda'),
    Inventario: require('./src/inventario')
}