const Eco = require('../src/Economy.js');

console.time()
const myEconomy = new Eco(['myDB', 'Users.sqlite', 'Inventory.sqlite', 'Guild.sqlite'])
console.timeEnd()
