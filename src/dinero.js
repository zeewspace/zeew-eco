const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp')
var colors = require('colors');
const {
    ZeewError
} = require('../utils/ZeewError');
const appdir = path.dirname(require.main.filename);

module.exports = {
    dinero
}

function save(data) {
    fs.writeFile('./zedb/economia.json', JSON.stringify(data, null, " "), (e) => {
        if (e) throw new ZeewError("No se Ha Podido Guardar Correctamente. \n Error: " + e);
    })
}

function dinero() {
    let direction = path.dirname(require.main.filename).split("/")
    if (!fs.existsSync(`${direction.join("/")}/zedb`)) {
        mkdirp(`${direction.join("/")}/zedb`, (e) => {
            if (e) throw new ZeewError("No se pudo crear la carpeta zedb para guardar las bases de datos de la tienda")
        })
        console.log("[Zeew.Economia]".green+" Carpeta ZEDB creado correctamente.".cyan)
    }
    if (!fs.existsSync('./zedb/economia.json')) {
        fs.writeFileSync('./zedb/economia.json', JSON.stringify({}, null, 2), {
            flag: 'wx'
        }, function (err) {
            if (err) throw new ZeewError(`No se Creo la base de datos de la economia.`.cyan+`\n error: ${err}`)
        });
        console.log("[Zeew.Economia]".green+" Base de Datos de Economia Creado Correctamente".cyan)
    }
}


function robar(clave, id1, id2, cantidad){
    let db = require(`${appdir}/zedb/economia.json`)
    if (!clave) throw new ZeewError("Debes Colocar la Id de un servidor".cyan)
    if (!id1) throw new ZeewError("Debes Colocar la ID de un usuario".cyan)
    if (!id2) throw new ZeewError("Debes Colocar la ID de otro usuario".cyan)
    if (!cantidad) throw new ZeewError("Debes colocar la cantidad que le quieres dar al usuario".cyan)

    if (isNaN(cantidad)) throw new ZeewError("Eso no es un numero".cyan)

    if (cantidad <= 0 || cantidad == Infinity) return "No puedes poner un numero menor a cero o muy grance"

    id1 = String(id1)
    id2 = String(id2)
    clave = String(clave)
    cantidad = Number(cantidad)

    if (!db[clave]) {
        db[clave] = {};
        save(db)
    }
    
    let user2 = db[clave][id2] ? db[clave][id2].dinero : 0;

    if(user2 <= 0) return "No Tiene Dinero para robarle"
    
    if (!db[clave][id1]) {
        db[clave][id1] = {
            dinero: Number(cantidad)
        }
        save(db)
    }

    db[clave][id1].dinero += cantidad
    db[clave][id2].dinero -= cantidad;

    let ahora = db[clave][id1].dinero
    save(db)
    return `$${ahora}`;
}

dinero.prototype.robar = robar;