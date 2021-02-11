const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Banco = new Schema({
  user: { type: String },
  guild: { type: String },
  money: { type: String },
});
module.exports = mongoose.model("Banco ", Banco);
