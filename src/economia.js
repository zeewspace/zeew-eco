class Economy {
  constructor(path) {
    this.db = require("../mysql");
    this.error = (e) => {
      console.log("[══════ Zeew Economia [Error]: " + e + " ═══════]");
    };
  }

  /**
   *
   * @param {*} user ID del usuarios
   * @param {*} guild Id del servidor
   * @return {Number} Cantidad de dinero
   */
  async ver(user, guild) {
    try {
      let db = await this.db.getSelectWhere(
        "economy",
        "money",
        `user = ${user} AND guild = ${guild}`
      );
      return db ? db[0].money : 0;
    } catch (error) {
      this.error(error);
    }
  }

  /**
   *
   * @param {*} user ID del usuario
   * @param {*} guild ID del servidor
   * @param {*} money Cantidad de dinero a agregar
   * @return {Number} Cantidad de dinero
   * @example eco.agregar("1234", "123", 50)
   */
  async agregar(user, guild, money) {
    let getuser = await this.db.getAllWhere(
      "economy",
      `user = ${user} AND guild = ${guild}`
    );

    if (!getuser) {
      let insert = { user: user, guild: guild, money };
      await this.db.insert("economy", insert);
      return parseInt(money);
    } else {
      try {
        let addmoney = parseInt(getuser[0].money) + parseInt(money);
        await this.db.update(
          "economy",
          `money = ${addmoney}`,
          `user = ${user} AND guild = ${guild}`
        );
        return addmoney;
      } catch (error) {
        this.error(error);
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
    let getuser = await this.db.getAllWhere(
      "economy",
      `user = ${user} AND guild = ${guild}`
    );

    if (!getuser) {
      return parseInt(money);
    } else {
      try {
        if (parseInt(getuser[0].money) <= 0) return 0;

        let addmoney = parseInt(getuser[0].money) - parseInt(money);
        await this.db.update(
          "economy",
          `money = ${addmoney}`,
          `user = ${user} AND guild = ${guild}`
        );
        return addmoney;
      } catch (error) {
        this.error(error);
      }
    }
  }

  /**
   *
   * @param {*} user ID del usuario
   * @param {*} guild ID del servidor
   */
  async reiniciar(user, guild) {
    try {
      await this.db.deletedb("economy", `user = ${user} AND guild = ${guild}`);
      return true;
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
    let getuser = await this.db.getAllWhere(
      "economy",
      `user = ${user} AND guild = ${guild}`
    );
    let randommonet = Math.floor(Math.random() * parseInt(count));

    if (!getuser) {
      let insert = { user: user, guild: guild, money: randommonet };
      await this.db.insert("economy", insert);
      return parseInt(randommonet);
    } else {
      try {
        let addmoney = parseInt(getuser[0].money) + parseInt(randommonet);
        await this.db.update(
          "economy",
          `money = ${addmoney}`,
          `user = ${user} AND guild = ${guild}`
        );
        return randommonet;
      } catch (error) {
        this.error(error);
      }
    }
  }

  // /**
  //  *
  //  * @param {*} user ID del usuario
  //  * @param {*} guild ID del servidor
  //  * @param {*} id ID del item en la tiendam
  //  */
  // async comprar(user, guild, id) {
  //   try {
  //     let db = await this.model.findOne({ user: user, guild: guild });
  //     let store = await this.store.findOne({ guild: guild });
  //     let inventory = await this.inventory.findOne({
  //       user: user,
  //       guild: guild,
  //     });

  //     if (!store) return { tienda: false };
  //     if (!db) return { user: false };

  //     let item = store.store
  //       .filter((a) => a.id === id)
  //       .map((a) => ({
  //         name: a.name,
  //         price: a.price,
  //         id: a.id,
  //         role: a.role,
  //       }))[0];

  //     if (!item) return { item: false };
  //     if (db.money < item.price) return { price: false };

  //     let removemoney = db.money - item.price;

  //     await this.remover(user, guild, item.price);

  //     let iv;
  //     if (item.role) {
  //       iv = {
  //         id,
  //         name: item.name,
  //         rol: item.role,
  //       };
  //     } else {
  //       iv = {
  //         id,
  //         name: item.name,
  //       };
  //     }

  //     if (inventory) {
  //       await this.inventory.updateOne(
  //         { user: user, guild: guild },
  //         {
  //           $push: {
  //             inventory: [iv],
  //           },
  //         }
  //       );
  //       return {
  //         item,
  //         money: parseInt(db.money),
  //         newmoney: removemoney,
  //       };
  //     } else {
  //       let inventario = new this.inventory({
  //         user,
  //         guild,
  //         inventory: [iv],
  //       });

  //       await inventario.save();
  //       return {
  //         item,
  //         money: parseInt(db.money),
  //         newmoney: removemoney,
  //       };
  //     }
  //   } catch (error) {
  //     this.error(error);
  //   }
  // }
}

module.exports = Economy;
