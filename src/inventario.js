class Inventario {
  constructor() {
    this.db = require("../mysql");
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e + " ═══════]");
    };
  }

  async ver(user, guild) {
    try {
      let find = this.db.getAllWhere(
        "zeew_inventory",
        `guild = ${guild} AND user = ${user}`
      );
      if (!find) return false;
      return find;
    } catch (error) {
      this.error(error.message);
    }
  }

  async item(user, guild, id) {
    try {
      let find = await this.db.getAllWhere(
        "zeew_inventory",
        `id = '${id}' and guild = ${guild} and user = ${user}`
      );
      return find
        ? {
            id: find[0].id,
            user: find[0].user,
            guild: find[0].guild,
            name: find[0].name,
            description: find[0].description,
          }
        : false;
    } catch (error) {
      this.error(error.message);
    }
  }

  async remover(user, guild, id) {
    try {
      let find = await this.db.getAllWhere(
        "zeew_inventory",
        `id = '${id}' and guild = ${guild} and user = ${user}`
      );
      if (find.length > 0) {
        await this.db.deletedb(
          "zeew_inventory",
          `id = '${id}' and guild = ${guild} and user = ${user}`
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.error(error.message);
    }
  }

  async reiniciar(user, guild) {
    try {
      let find = this.db.getAllWhere(
        "zeew_inventory",
        `guild = ${guild} AND user = ${user}`
      );
      if (!find) return false;

      await this.db.deletedb(
        "zeew_inventory",
        `guild = ${guild} AND user = ${user}`
      );
    } catch (error) {
      this.error(error.message);
    }
  }
}

module.exports = Inventario;
