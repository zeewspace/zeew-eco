/**
 * Clase Economia
 * @class Economia
 * @author Zeew.dev <proyects@zeew.dev>
 * @author KamerrEzz <developer@kamerrezz>
 * @description Clase Economia
 */

class Economy {
  constructor() {
    /**
     * @private
     */
    this.model = require("./models/eco");
    /**
     * @private
     */
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
    };
    /**
     * @private
     */
    this.store = require("./models/store");
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
   *
   * @param {String} user ID del usuarios
   * @param {String} guild Id del servidor
   * @return {Number} Cantidad de dinero
   */
  async ver(user, guild) {
    let db = await this.model.findOne({ user: user, guild: guild });

    if (db) {
      return db.money;
    } else {
      return 0;
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor
   * @param {Number} money Cantidad de dinero a agregar
   * @return {Number} Cantidad de dinero
   */
  async agregar(user, guild, money) {
    let db = await this.model.findOne({ user: user, guild: guild });

    if (db) {
      try {
        let add = parseInt(db.money) + parseInt(money);
        await this.model.updateOne(
          { user: user, guild: guild },
          { money: add }
        );

        return add;
      } catch (error) {
        this.error(error);
      }
    } else {
      let add = new this.model({
        user,
        guild,
        money,
      });

      try {
        await add.save();
        return money;
      } catch (e) {
        this.error(e);
      }
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor
   * @param {Number} money Cantidad de dinero a quitar
   * @return {Number} Cantidad de dinero
   */
  async remover(user, guild, money) {
    let db = await this.model.findOne({ user: user, guild: guild });
    if (db) {
      try {
        let remove = db.money - money;
        await this.model.updateOne(
          { user: user, guild: guild },
          { money: String(remove) }
        );
        return remove;
      } catch (error) {
        this.error(error);
      }
    } else {
      return 0;
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor
   * @returns {Boolean} Da true si todo salio correctamente o false si no
   */
  async reiniciar(user, guild) {
    try {
      await this.model.deleteOne({ user: user, guild: guild });
      return true;
    } catch (error) {
      this.error(error);
      return false;
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor
   * @param {String} id ID del item en la tienda
   * @returns {{item: {name: String, price: Number, id: String, role: String},money: Number, newmoney: Number }} Regresa el item, la cantidad de dinero y la cantidad de dinero despues de comprar el item
   */
  async comprar(user, guild, id) {
    try {
      let db = await this.model.findOne({ user: user, guild: guild });
      let store = await this.store.findOne({ guild: guild });
      let inventory = await this.inventory.findOne({
        user: user,
        guild: guild,
      });

      if (!store) return { tienda: false };
      if (!db) return { user: false };

      let item = store.store
        .filter((a) => a.id === id)
        .map((a) => ({
          name: a.name,
          price: a.price,
          id: a.id,
          item: a.item,
        }))[0];

      if (!item) return { item: false };
      if (db.money < item.price) return { price: false };

      let removemoney = db.money - item.price;
      id = this.uuid()

      await this.remover(user, guild, item.price);

      let iv;
      if (item.item) {
        iv = {
          id,
          name: item.name,
          item: item.item,
        };
      } else {
        iv = {
          id,
          name: item.name,
        };
      }

      if (inventory) {
        await this.inventory.updateOne(
          { user: user, guild: guild },
          {
            $push: {
              inventory: [iv],
            },
          }
        );
        return {
          item,
          money: parseInt(db.money),
          newmoney: removemoney,
        };
      } else {
        let inventario = new this.inventory({
          user,
          guild,
          inventory: [iv],
        });

        await inventario.save();
        return {
          item,
          money: parseInt(db.money),
          newmoney: removemoney,
        };
      }
    } catch (error) {
      this.error(error);
    }
  }

  /**
   *
   * @param {String} user ID del usuario
   * @param {String} guild ID del servidor
   * @param {Number} count Cantidad maxima aleatoriamente
   * @returns {Number} Regresa un numero aleatorio entre 0 y count
   */
  async trabajar(user, guild, count) {
    let db = await this.model.findOne({ user: user, guild: guild });
    let randommonet = Math.floor(Math.random() * count);
    if (db) {
      try {
        let work = parseInt(db.money) + parseInt(randommonet);
        await this.model.updateOne(
          { user: user, guild: guild },
          { money: work }
        );

        return randommonet;
      } catch (error) {
        this.error(error);
      }
    } else {
      let add = new this.model({
        user,
        guild,
        money: randommonet,
      });

      try {
        await add.save();
        return randommonet;
      } catch (e) {
        this.error(e);
      }
    }
  }
}

module.exports = Economy;
