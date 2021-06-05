class Banco {
  constructor(path) {
    // this.db = require(path);
    this.db = require("../mysql");
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e + " ═══════]");
    };
  }

  /**
   *
   * @param {Number} user ID del usuario
   */
  async ver(user, guild) {
    try {
      let db = await this.db.getSelectWhere(
        "zeew_banco",
        "money",
        `user = ${user} AND guild = ${guild}`
      );
      return db ? db[0].money : 0;
    } catch (error) {
      this.error(error.message);
    }
  }
  /**
   *
   * @param {Number} user ID del usuario
   * @param {Number} money Cantidad de dinero a agregar
   */
  async agregar(user, guild, money) {
    try {
      let getbanco = await this.db.getSelectWhere(
        "zeew_banco",
        "money",
        `user = ${user} AND guild = ${guild}`
      );

      if (!getbanco) {
        try {
          let insert = { user: user, guild: guild, money };
          await this.db.insert("zeew_banco", insert);
          return parseInt(money);
        } catch (error) {
          this.error(error.message);
        }
      } else {
        try {
          let addmoney = parseInt(getbanco[0].money) + parseInt(money);
          await this.db.update(
            "zeew_banco",
            `money = ${addmoney}`,
            `user = ${user} AND guild = ${guild}`
          );
          return parseInt(addmoney);
        } catch (error) {
          this.error(error.message);
        }
      }
    } catch (error) {
      this.error(error.message);
    }
  }

  /**
   *
   * @param {Number} user ID del usuario
   * @param {Number} money Cantidad de dinero a remover
   */
  async remover(user, guild, money) {
    let getbanco = await this.db.getSelectWhere(
      "zeew_banco",
      "money",
      `user = ${user} AND guild = ${guild}`
    );

    if (getbanco) {
      try {
        if (parseInt(getbanco[0].money) <= 0) return 0;
        let removeMoney = parseInt(getbanco[0].money) - parseInt(money);
        await this.db.update(
          "zeew_banco",
          `money = ${removeMoney}`,
          `user = ${user} AND guild = ${guild}`
        );
        return parseInt(removeMoney);
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
      await this.db.deletedb(
        "zeew_banco",
        `user = ${user} AND guild = ${guild}`
      );
      return true;
    } catch (error) {
      this.error(error.message);
    }
  }

  async depositar(user, guild, money) {
    try {
      let getbanco = await this.db.getSelectWhere(
        "zeew_banco",
        "money",
        `user = ${user} AND guild = ${guild}`
      );
      let geteconomia = await this.db.getSelectWhere(
        "economy",
        "money",
        `user = ${user} AND guild = ${guild}`
      );
      if (!geteconomia) return { economia: false };
      try {
        if (parseInt(geteconomia[0].money) < money) return 0;
        let removeMoney = parseInt(geteconomia[0].money) - parseInt(money);
        let addBank = parseInt(getbanco[0].money) + parseInt(money);
        await this.db.update(
          "economy",
          `money = ${removeMoney}`,
          `user = ${user} AND guild = ${guild}`
        );
        if (getbanco) {
          await this.db.update(
            "zeew_banco",
            `money = ${addBank}`,
            `user = ${user} AND guild = ${guild}`
          );
          return { removeMoney, addBank };
        } else {
          let insert = { user: user, guild: guild, money: addBank };
          await this.db.insert("zeew_banco", insert);
          return { removeMoney, addBank };
        }
      } catch (error) {
        console.log(error);
        this.error(error.message);
      }
    } catch (error) {
      this.error(error.message);
    }
  }

  async retirar(user, guild, money) {
    try {
      let getbanco = await this.db.getSelectWhere(
        "zeew_banco",
        "money",
        `user = ${user} AND guild = ${guild}`
      );
      let geteconomia = await this.db.getSelectWhere(
        "economy",
        "money",
        `user = ${user} AND guild = ${guild}`
      );
      if (!getbanco) return { banco: false };
      try {
        if (parseInt(geteconomia[0].money) < money) return 0;
        let addMoney = parseInt(geteconomia[0].money) + parseInt(money);
        let removeBank = parseInt(getbanco[0].money) - parseInt(money);
        await this.db.update(
          "economy",
          `money = ${addMoney}`,
          `user = ${user} AND guild = ${guild}`
        );
        await this.db.update(
          "zeew_banco",
          `money = ${removeBank}`,
          `user = ${user} AND guild = ${guild}`
        );
        return { addMoney, removeBank };
      } catch (error) {
        console.log(error);
        this.error(error.message);
      }
    } catch (error) {
      this.error(error.message);
    }
  }
}

module.exports = Banco;
