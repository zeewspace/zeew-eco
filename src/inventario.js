const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp')
var colors = require('colors');
const {
    ZeewError
} = require('../utils/ZeewError');
const appdir = path.dirname(require.main.filename);

module.exports = {
    inventario
}

function save(data) {
    fs.writeFile('./zedb/inventario.json', JSON.stringify(data, null, " "), (e) => {
        if (e) throw new ZeewError("No se Ha Podido Guardar Correctamente. \n Error: " + e);
    })
}

function inventario() {
    let direction = path.dirname(require.main.filename).split("/")
    if (!fs.existsSync(`${direction.join("/")}/zedb`)) {
        mkdirp(`${direction.join("/")}/zedb`, (e) => {
            if (e) throw new ZeewError("No se pudo crear la carpeta zedb para guardar las bases de datos de la tienda")
        })
        console.log("[Zeew.Economia]".green + " Carpeta ZEDB creado correctamente.".cyan)
    }
    if (!fs.existsSync('./zedb/inventario.json')) {
        fs.writeFileSync('./zedb/inventario.json', JSON.stringify({}, null, 2), {
            flag: 'wx'
        }, function (err) {
            if (err) throw new ZeewError(`No se Creo la base de datos del inventario.`.cyan + `\n error: ${err}`)
        });
        console.log("[Zeew.Economia]".green + " Base de Datos de Inventario Creado Correctamente".cyan)
    }
}

function agregar(clave, id, inv) {
    let db = require(`${appdir}/zedb/inventario.json`)
    if (!clave) throw new ZeewError("Ingresa la clave / ID del servidor".cyan)
    if (!id) throw new ZeewError('Ingresa la ID del usuarior'.cyan)
    if (!inv) throw new ZeewError('Tienes que ingresar algo en la tienda')


    id = String(id)

    let inve = inv;

    if (!db[clave]) {
        db[clave] = {};
        save(db)
    }
    if (!db[clave][id]) {
        db[clave][id] = {}
        save(db)
    }
    if (!db[clave][id].inventario) {
        db[clave][id].inventario = {
            inv1: inve
        }
        save(db)
    }

    let n = 1;
    let existe = "no"
    for (let e in db[clave][id].inventario) {
        if (db[clave][id].inventario[e].toLowerCase() == inve.toLowerCase()) {
            existe = "si"
        }
        n += 1;
    }

    if (existe == "si") return `Ya Existe en tu inventario.`

    let item = `inv${n}`
    db[clave][id].inventario[item] = inv

    save(db)

    return "Agregado Correctamente"

}

function compras(clave, id, item, tipo) {
    let db = require(`${appdir}/zedb/inventario.json`)
    if (!clave) throw new ZeewError("Ingresa la clave / ID del servidor".cyan)
    if (!id) throw new ZeewError('Ingresa la ID del usuario'.cyan)

    if (!item) return "Ingresa el Numero del item para agregarlo a tu inventario"
    if (!fs.existsSync('./zedb/tienda.json')) {
        return "No hay una tienda en este servidor"
    }

    let tddb = require(`${appdir}/zedb/tienda.json`)
    let tditem = `item${item}`
    let tienda = tddb[clave].nombre[tditem]
    if (!tienda) return "No existe ese item en la tienda"

    if (!db[clave]) {
        db[clave] = {};
        save(db)
    }
    if (!db[clave][id]) {
        db[clave][id] = {}
        save(db)
    }
    if (!db[clave][id].compras) {
        db[clave][id].compras = {
            inv1: tienda
        }
        save(db)
    }
    let n = 1;
    if (tipo) {
        if (typeof tipo != "boolean") {
            throw new ZeewError("Error: El parametro tiene que ser un boolean.");
        }

        let existe = "no"
        for (let e in db[clave][id].compras) {
            if (tddb[clave].nombre[tditem].toLowerCase() == db[clave][id].compras[e].toLowerCase()) {
                existe = "si"
            }
            n += 1;
        }
        if (existe == "si") return `Ya Existe en tu inventario.`
    }

    for (let a in db[clave][id].compras) {
        n += 1;
    }

    let iditem = `inv${n}`
    db[clave][id].compras[iditem] = tienda

    save(db)

    return "Agregado Correctamente"
}

function quitarcompras(clave, id, inv) {
    let db = require(`${appdir}/zedb/inventario.json`)
    if (!clave) throw new ZeewError("Ingresa la clave / ID del servidor".cyan)
    if (!id) throw new ZeewError('Ingresa la ID del usuario'.cyan)

    let iditem = `inv${inv}`
    let inve = db[clave][id]

    if (!inve.compras[iditem]) {
        return "No Existe ese item en tu inventario"
    }


    inve.compras[iditem] = false;
    let n = 0;

    for (let x in inve.compras) {
        if (inve.compras[x] != false && n != 0) {
            inve.compras[n] = inve.compras[x]

            inve.compras[x] = false

            n = x
        }
        if (inve.compras[x] == false) {
            n = x
        }
    }
    for (let e in inve.compras) {
        if (inve.compras[e] == false) {
            delete inve.compras[e]
        }
    }
    save(db)
    return "Eliminado correctamente"
}

function vercompras(clave, id) {
    let db = require(`${appdir}/zedb/inventario.json`)
    if (!clave) throw new ZeewError("Ingresa la clave / ID del servidor".cyan)
    if (!id) throw new ZeewError('Ingresa la ID del Usuario'.cyan)

    let msg = "";
    let c = db[clave][id]
    for(let i in c.compras){

        msg += `Compra: ${c.compras[i]} ID: ${i}\n`
    }
    return msg;
}


//inventario.prototype.agregar = agregar;
inventario.prototype.compras = compras;
inventario.prototype.quitarcompras = quitarcompras;
inventario.prototype.vercompras = vercompras;