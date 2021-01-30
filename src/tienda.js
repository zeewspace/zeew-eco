class tienda {
  constructor() {
    this.model = require("./models/store");
    this.error = () => {
      console.log("[══════ Zeew Economia: " + e.message + " ═══════]");
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
      let findItem = await this.model.findOne({ guild: guild });

      if (findItem) {
        await this.model.updateOne(
          { guild: guild },
          {
            $push: {
              store: [
                {
                  id: this.uuid(),
                  name,
                  description,
                  price,
                  isRole,
                  role: role ? role : null,
                },
              ],
            },
          }
        );
        return {
          id: this.uuid(),
          name,
          description,
          price,
          isRole,
          role: role ? role : null,
        };
      } else {
        let add = new this.model({
          guild,
          store: [
            {
              id: this.uuid(),
              name,
              description,
              price,
              isRole,
              role: role ? role : null,
            },
          ],
        });

        await add.save();
        return add.store[0];
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
