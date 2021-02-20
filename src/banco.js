class Banco {
  constructor() {
    this.db = require("./models/banco");
    this.eco = require("./models/eco");
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
    };
  }

  /**
   *
   * @param {Number} user ID del usuario
   */
  async ver(user, guild) {
    let db = await this.db.findOne({ user: user, guild: guild});
    if (db) {
      return db.money;
    } else {
      return 0;
    }
  }
  /**
   *
   * @param {Number} user ID del usuario
   * @param {Number} money Cantidad de dinero a agregar
   */
  async agregar(user, guild, money) {
    let db = await this.db.findOne({ user: user });

    if (db) {
      try {
        let add = parseInt(db.money) + parseInt(money);
        await this.db.updateOne({ user: user, guild: guild }, { money: add });

        return add;
      } catch (error) {
        this.error(error);
      }
    } else {
      let add = new this.db({
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
   * @param {Number} user ID del usuario
   * @param {Number} money Cantidad de dinero a remover
   */
  async remover(user, guild, money) {
    let db = await this.db.findOne({ user: user, guild: guild });

    if (db) {
      try {
        let remove = parseInt(db.money) - parseInt(money);
        await this.db.updateOne(
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
   * @param {Number} user ID del usuario
   */
  async reiniciar(user, guild) {
    try {
      await this.db.deleteOne({ user: user, guild: guild });
      return true;
    } catch (error) {
      this.error(error);
    }
  }

  async depositar(user, guild, money) {
    try {
      let db = await this.db.findOne({ user: user, guild: guild });
      let eco = await this.eco.findOne({ user: user, guild: guild });

      if (eco) {
        if (db) {
          let { removeEco, addBank } = this._remove(db, eco, money);
          await this.db.updateOne(
            { user: user, guild: guild },
            { money: addBank }
          );
          await this.eco.updateOne(
            { user: user, guild: guild },
            { money: removeEco }
          );

          return {
            Economia: removeEco,
            Banco: addBank,
          };
        } else {
          let newMoney = parseInt(eco.money) - money;
          await this.eco.updateOne(
            { user: user, guild: guild },
            { money: newMoney }
          );
          await this.db({
            user,
            guild,
            money,
          });

          return {
            Economia: removeEco,
            Banco: money,
          };
        }
      } else {
        return false;
      }
    } catch (error) {
      this.error(error);
    }
  }

  async retirar(user, guild, money) {
    try {
      let db = await this.db.findOne({ user: user, guild: guild });
      let eco = await this.eco.findOne({ user: user, guild: guild });

      if (db) {
        if (eco) {
          let { addEco, removeBank } = this._add(db, eco, money);

          await this.eco.updateOne({ user: user, guild: guild}, { money: addEco})
          await this.db.updateOne({user: user, guild: guild}, { money: removeBank})

          return {
            addEco,
            removeBank
          }
        } else {
            return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      this.error(error);
    }
  }

  _remove(db, eco, money) {
    let removeEco = parseInt(money) - parseInt(eco.money);
    let addBank = parseInt(db.money) + parseInt(money);

    return {
      removeEco, 
      addBank,
    };
  }
  _add(db, eco, money) {
    let addEco = parseInt(money) + parseInt(eco.money);
    let removeBank = parseInt(db.money) - parseInt(money);

    return {
      addEco,
      removeBank,
    };
  }
}

module.exports = Banco;