const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp')
var colors = require('colors');
const {
    ZeewError
} = require('../utils/ZeewError');
const appdir = path.dirname(require.main.filename);


module.exports = {
    economia
}

function save(data) {
    fs.writeFile('./zedb/economia.json', JSON.stringify(data, null, " "), (e) => {
        if (e) throw new ZeewError("No se Ha Podido Guardar Correctamente. \n Error: " + e);
    })
}

function economia() {
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
            if (err) throw new ZeewError(`No se Creo la base de datos de la tienda.`.cyan+`\n error: ${err}`)
        });
        console.log("[Zeew.Economia]".green+" Base de Datos de Economia Creado Correctamente".cyan)
    }
}

function agregar(clave, id, cantidad) {
    let db = require(`${appdir}/zedb/economia.json`)
    if (!clave) throw new ZeewError("Debes Colocar la Id de un servidor".cyan)
    if (!id) throw new ZeewError("Debes Colocar la ID de un usuario".cyan)
    if (!cantidad) throw new ZeewError("Debes colocar la cantidad que le quieres dar al usuario".cyan)

    if (isNaN(cantidad)) throw new ZeewError("Eso no es un numero".cyan)

    if (cantidad <= 0 || cantidad == Infinity) return "No puedes poner un numero menor a cero o muy grance"

    id = String(id)
    clave = String(clave)
    cantidad = Number(cantidad)

    if (!db[clave]) {
        db[clave] = {};
        save(db)
    }

    if (!db[clave][id]) {
        db[clave][id] = {
            dinero: Number(cantidad)
        }
        save(db)
    }

    db[clave][id].dinero += cantidad
    let ahora = db[clave][id].dinero
    save(db)
    return `$${ahora}`;

}

function quitar(clave, id, cantidad) {
    let db = require(`${appdir}/zedb/economia.json`)
    if (!clave) throw new ZeewError("Debes Colocar la Id de un servidor".cyan)
    if (!id) throw new ZeewError("Debes Colocar la ID de un usuario".cyan)
    if (!cantidad) throw new ZeewError("Debes colocar la cantidad que le quieres dar al usuario".cyan)

    if (isNaN(cantidad)) throw new ZeewError("Eso no es un numero".cyan)

    if (cantidad <= 0 || cantidad == Infinity) return "No puedes poner un numero menor a cero o muy grance"

    id = String(id)
    clave = String(clave)
    cantidad = Number(cantidad)

    if (!db[clave]) {
        db[clave] = {};
        save(db)
    }

    let msg;
    if (!db[clave][id]) {
        return "No tienes dinero"
    }

    if(db[clave][id].dinero == 0) return "Tu dinero es 0, no puedes quitarle mas."

    db[clave][id].dinero -= cantidad
    let ahora = db[clave][id].dinero
    save(db)
    return `$${ahora}`
}

function comprar(clave, id, item){
    // let tdb = require(`${appdir}/zedb/tienda.json`)
    if(!clave) return new ZeewError("Coloca una clave / ID de servidor".cyan)
    if(!id) return new ZeewError("Coloca la ID del usuario".cyan)
    if(!item) return new ZeewError("Coloca el item".cyan)

    id = String(id)
    item = String(item)
    clave = String(clave)

    if (!fs.existsSync('./zedb/tienda.json')) {
        return "No hay Una Tienda en el servidor"
        
    }
        
    if (fs.existsSync('./zedb/tienda.json')) {
        let db = require(`${appdir}/zedb/economia.json`.cyan)
        let tdb = require(`${appdir}/zedb/tienda.json`.cyan)

        let i = `item${item}`

        let dinero = db[clave][id].dinero
        let tienda = tdb[clave]

        if(dinero < tienda.precio) return "No Tienes el dinero suficiente"
        if(!tdb[clave].nombre[i]) return "No Existe Ese Item En la tienda"
       
        db[clave][id]={
            dinero: dinero - tienda.precio[i]
        }

        save(db)
        return `Compra Realizada: \nItem: ${tienda.nombre[i]} \nDescripcion: ${tienda.descripcion[i]}\nPrecion: $${tienda.precio[i]}`
    }


}

function mostrar(clave, id){
    let db = require(`${appdir}/zedb/economia.json`)
    if(!clave) throw new ZeewError("Ingresa la clave / ID del servidor".cyan)
    if(!id) throw new ZeewError('Ingresa la ID del servidor'.cyan)

    clave = String(clave)
    id = String(id)

    let dinero = db[clave][id] ? db[clave][id].dinero : 0;

    if(dinero == 0) return "No tienes dinero"

    return dinero;

}

economia.prototype.agregar = agregar;
economia.prototype.quitar = quitar;
economia.prototype.comprar = comprar;
economia.prototype.mostrar = mostrar;