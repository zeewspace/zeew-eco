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

  /**
   *
   * @param {*} user ID del usuario
   * @param {*} guild ID del servidor
   * @param {*} id ID del item en la tiendam
   */
  async comprar(user, guild, id) {
    try {
      let find = await this.db.getAllWhere("zeew_store", `guild = ${guild}`);
      if (!find) return {store: false};
      let item = await this.db.getAllWhere("zeew_store", `guild = '${guild}' AND id = '${id}'`);
      if(!item) return {item: false};
      let getuser = await this.db.getSelectWhere("zeew_economy", "money", `guild = ${guild} AND user = ${user}`);
      if(!getuser) return {user: false};
      console.log(getuser[0].money < item[0].price);
      console.log(getuser[0].money);
      console.log(item[0].price);
      if(item[0].price > getuser[0].money) return {money: false};
      
      await this.db.update("zeew_economy", `money = ${getuser[0].money - item[0].price}`, `user = ${user} AND guild = ${guild}`);
      let insert = {id: this.uuid(), user, guild, name: item[0].name, description: item[0].description};
      await this.db.insert("zeew_inventory", insert);

      return insert


    } catch (error) {
      this.error(error);
    }
  }
}
module.exports = tienda;
