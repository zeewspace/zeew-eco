class Inventario {
  constructor() {
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
    };
    this.inventory = require("./models/inventory");
  }

  async ver(user, guild) {
    let db = await this.inventory.findOne({
      user: user,
      guild: guild,
    });

    if (db) {
      return db.inventory;
    } else {
      return false;
    }
  }
}

module.exports = Inventario;