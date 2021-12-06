class tienda {
  constructor() {
    /**
     * @private
     */
    this.model = require("./models/store");
    /**
     * @private
     */
    this.error = (e) => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
    };
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
   * @param {Number} guild Id del servidor
   * @returns {Array} Lista de los items de la tienda
   */
  async ver(guild) {
    try {
      let find = await this.model.findOne({ guild: guild });
      if (find) {
        return find.store;
      } else {
        return false;
      }
    } catch (error) {}
  }
  /**
   *
   * @param {String} guild ID del servidor
   * @param {String} name Nombre del Item
   * @param {String} description Descripcion del item
   * @param {Number} price Precio del item
   * @param {String} item alguna clave de algun item, role, emoji, etc
   * @returns {{id: String, name: String, description: String,price: Number, item: String }} Datos Agregados
   */
  async agregar(guild, name, description, price, item) {
    try {
      let findItem = await this.model.findOne({ guild: guild });
      const id = this.uuid();

      if (findItem) {
        await this.model.updateOne(
          { guild: guild },
          {
            $push: {
              store: [
                {
                  id,
                  name,
                  description,
                  price,
                  item: item ?? null,
                },
              ],
            },
          }
        );
        return {
          id,
          name,
          description,
          price,
          item: item ?? null,
        };
      } else {
        let add = new this.model({
          guild,
          store: [
            {
              id,
              name,
              description,
              price,
              isRole,
              item: item ?? null,
            },
          ],
        });

        await add.save();
        return {
          id,
          name,
          description,
          price,
          item: item ?? null,
        };
      }
    } catch (error) {
      this.error(error);
    }
  }
  /**
   *
   * @param {Number} guild ID del servidor
   * @param {String} id ID del item generado
   */
  async remover(guild, id) {
    try {
      let findItem = await this.model.findOne({ guild: guild });
      if (findItem) {
        let store = findItem.store.filter((a) => a.id !== id);
        await this.model.updateOne({ guild: guild }, { store: store });
        return true;
      } else {
        return false;
      }
    } catch (error) {}
  }

  /**
   *
   * @param {Number} guild ID del servidor
   * @returns {Boolean} True si fue eliminado
   */
  async reiniciar(guild) {
    try {
      await this.model.deleteOne({ guild: guild });
      return true;
    } catch (error) {
      this.error(error);
    }
  }
}
module.exports = tienda;
