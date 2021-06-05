class tienda {
  constructor() {
    this.db = require("../mysql");
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e + " ═══════]");
    };
    this.uuid = () => {
      const { v4: uuidv4 } = require("uuid");
      let id = uuidv4();
      return id.slice(0, 8);
    };
  }

  /**
   *
   * @param {Number} guild Id del servidor
   * @returns {Array} Lista de los items de la tienda
   */
  async ver(guild) {
    try {
      let find = this.db.getAllWhere("zeew_store", `guild = ${guild}`);
      if (!find) return false;
      return find;
    } catch (error) {
      this.error(error.message);
    }
  }
  /**
   *
   * @param {Number} guild ID del servidor
   * @param {String} name Nombre del Item
   * @param {String} description Descripcion del item
   * @param {Number} price Precio del item
   * @param {boolean} isRole Si es un rol
   * @param {Number} role ID del rol
   * @returns {Object} Datos Agregados
   */
  async agregar(guild, name, description, price, isRole, role) {
    try {
      let insert = {
        id: this.uuid(),
        guild,
        name,
        description,
        price: parseInt(price),
        isRole,
        role,
      };
      await this.db.insert("zeew_store", insert);
      return insert;
    } catch (error) {
      console.log(error);
      this.error(error.message);
    }
  }
  /**
   *
   * @param {Number} guild ID del servidor
   * @param {String} id ID del item generado
   */
  async remover(guild, id) {
    try {
      let find = this.db.getAllWhere("zeew_store", `guild = ${guild}`);
      if (!find) return false;
      let item = this.db.getAllWhere("zeew_store", `guild = ${guild} AND id = ${id}`);
      if(!item) return false;

      await this.db.deletedb("zeew_store", `guild = ${guild} AND id = ${id}`)
      return true;
    } catch (error) {
      this.error(error.message);
    }
  }

  /**
   *
   * @param {Number} guild ID del servidor
   * @returns {Boolean} True si fue eliminado
   */
  async reiniciar(guild) {
    try {
      let find = this.db.getAllWhere("zeew_store", `guild = ${guild}`);
      if (!find) return false;
      await this.db.deletedb("zeew_store", `guild = ${guild}`)
      return true;
    } catch (error) {
      this.error(error);
    }
  }
}
module.exports = tienda;
