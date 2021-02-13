const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Economia = new Schema({
  user: { type: String },
  guild: { type: String },
  money: { type: Number },
});
module.exports = mongoose.model("Economia ", Economia);
