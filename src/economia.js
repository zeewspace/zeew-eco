class Economy {
  constructor() {
    this.model = require("./models/eco");
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
    };
    this.store = require("./models/store");
    this.inventory = require("./models/inventory");
  }

  /**
   *
   * @param {*} user ID del usuarios
   * @param {*} guild Id del servidor
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
   * @param {*} user ID del usuario
   * @param {*} guild ID del servidor
   * @param {*} money Cantidad de dinero a agregar
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
   * @param {*} user ID del usuario
   * @param {*} guild ID del servidor
   * @param {*} money Cantidad de dinero a quitar
   * @return {Number} Cantidad de dinero
   */
  async remover(user, guild, money) {
    let db = await this.model.findOne({ user: user, guild: guild });

    if (db) {
      try {
        let remove = parseInt(db.money) - parseInt(money);
        await this.model.updateOne(
          { user: user, guild: guild },
          { money: remove }
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
   * @param {*} user ID del usuario
   * @param {*} guild ID del servidor
   */
  async reiniciar(user, guild) {
    try {
      await this.model.deleteOne({ user: user, guild: guild });
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
      let db = await this.model.findOne({ user: user, guild: guild });
      let store = await this.store.findOne({ guild: guild });
      let inventory = await this.inventory.findOne({
        user: user,
        guild: guild,
      });
      let item = store.store
        .filter((a) => a.id === id)
        .map((a) => ({
          name: a.name,
          price: a.price,
          id: a.id,
          role: a.role,
        }))[0];
      if (!store) return { tienda: false };
      if (!db) return { user: false };
      if (!item) return { item: false };

      let removemoney = db.money - item.price;

      await this.remover(user, guild,removemoney)

      let iv;
      if (item.role) {
        iv = {
          id,
          name: item.name,
          rol: item.role,
        };
      } else {
        iv = {
          id,
          name: item.name,
        };
      }

      if (inventory) {
        await this.inventory.updateOne({ user: user, guild: guild},
          {
            $push: {
              inventory: [iv]
            }
          })
          return {
            item,
            money: parseInt(db.money),
            newmoney: removemoney
          }
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
          newmoney: removemoney
        }
      }
    } catch (error) {
      this.error(error);
    }
  }
  /**
   *
   * @param {*} user ID del usuario
   * @param {Numer} guild ID del servidor
   * @param {*} count Cantidad maxima aleatoriamente
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

        return work;
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
