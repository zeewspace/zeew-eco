/**
 * Clase Inventario
 * @class Inventario
 * @author Zeew.dev <proyects@zeew.dev>
 * @author KamerrEzz <developer@kamerrezz>
 * @description Clase inventario
 */

class Inventario {
  constructor() {
    /**
     *
     * @private
     */
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
    };
    /**
     * @private
     */
    this.inventory = require("./models/inventory");
    /**
     * @private
     */
    this.uuid = () => {
      const { v4: uuidv4 } = require("uuid");
      let id = uuidv4();
      return id.slice(0, 8);
    };
  }

  /**
   * Get all items
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor - Clave de Indentificación
   * @returns {Array<{id: String, name: String}>} Retorna una lista de objetos con el id y el nombre del item
   * @example inventario.ver("123123123", "123123123");
   */
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

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor - Clave de Indentificación
   * @param {String} id ID del item
   * @returns {{id: String, name: String}} Retorna un objeto con el id y el nombre del item si existe,
   * caso contrario retorna { item: false } si el item no existe,
   * { inventory: false } si el inventario no existe
   */
  async item(user, guild, id) {
    let db = await this.inventory.findOne({ user: user, guild: guild });
    if (!db) return { inventario: false };
    let inv = await db.inventory.filter((item) => item.id === id);

    if (db) {
      if (inv) {
        return inv[0];
      } else {
        return { item: false };
      }
    } else {
      return { inventory: false };
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor - Clave de Indentificación
   * @param {String} name Nombre del item
   * @param {String} item Clave del item, rol, dinero, etc
   * @returns {{id: String, name: String, item: String}}
   */
  async agregar(user, guild, name, item) {
    try {
      let db = await this.inventory.findOne({ user: user, guild: guild });
      const id = this.uuid();

      if (db && db.inventory.length > 0) {
        db.inventory.push({ id: id, name: name, item: item });
        await db.save();
        return { id: id, name: name, item: item };
      }

      if (db) {
        db.push({ id, name, item });
        db.inventory = inv;
        await db.save();
        return {
          id,
          name,
          item,
        };
      } else {
        let inv = [{ id, name, item }];
        let newInventory = new this.inventory({
          user: user,
          guild: guild,
          inventory: inv,
        });
        await newInventory.save();

        return {
          id,
          name,
          item,
        };
      }
    } catch (error) {
      this.error(error);
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor - Clave de Indentificación
   * @param {String} id ID del item
   * @return {Boolean} Retorna true si se elimina el item, false si no existe el item
   */
  async remover(user, guild, id) {
    let db = await this.inventory.findOne({ user: user, guild: guild });
    if (!db) return { inventario: false };
    let inv = await db.inventory.filter((item) => item.id !== id);

    if (db) {
      if (inv && inv.length === 0) {
        db.inventory = inv;
        await db.save();
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor - Clave de Indentificación
   * @returns {Boolean} Retorna true si se elimina el inventario, false si no existe el inventario
   */
  async reiniciar(user, guild) {
    try {
      let db = await this.inventory.deleteOne({ user: user, guild: guild });

      if (db) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.error(error);
    }
  }
}

module.exports = Inventario;
