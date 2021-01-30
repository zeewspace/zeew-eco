const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Inventory = new Schema({
    user: { type: String },
    guild: { type: String },
    inventory: { type: Array }
})

module.exports = mongoose.model("Inventory", Inventory)

// {
//     user: 1231231,
//     guild: 123123123,
//     inventario: [
//         {
//             item: "la lora",
//             use: true,
//         },
//         {
//             item: "la lora",
//             use: false,
//         },
//     ]
// }