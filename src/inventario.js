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

  async item(user, guild, id) {
    let db = await this.inventory.findOne({user: user, guild: guild})
    let inv = await db.inventory.map(item => item.id === id);

    if(db) {
        if(inv) {
          return inv;
        } else {
          return {item: false};
        }
    } else {
      return {inventory: false};
    }
  }

  async remover(user, guild){

  }

  async reiniciar(user, guild){

  }


}

module.exports = Inventario;