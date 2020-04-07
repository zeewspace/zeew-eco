const {tienda} = require('./src/tienda');
const {economia} = require('./src/economia');
const {dinero} = require('./src/dinero');
const {inventario} = require('./src/inventario');
var colors = require('colors');

console.log(`╔[══════════════ Zeew Economy ══════════════]╗
╠[══════ Economia Basica Para tu Bot ═══════]╣
╚[═════════════ Vercion Beta ═══════════════]╝`)

module.exports = {
    tienda,
    economia,
    dinero,
    inventario
}