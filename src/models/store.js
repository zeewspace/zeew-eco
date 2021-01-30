const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Store = new Schema({
  guild: { type: String },
  store: { type: Array },
});
module.exports = mongoose.model("Store", Store);
// {
//     guild: 123123123,
//     items: [
//         {
//             id: 
//             item: "la lora",
//             price: 30,
//             isrol: true,
//             rol: 123123123
//         },
//         {
//             item: "la lora",
//             price: 30,
//             isrol: false,
//         },
//     ]
// }