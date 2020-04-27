const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp')
var colors = require('colors');
const {
    ZeewError
} = require('../utils/ZeewError');
const appdir = path.dirname(require.main.filename);

module.exports = {
    tienda
}

function save(data) {
    fs.writeFile('./zedb/tienda.json', JSON.stringify(data, null, " "), (e) => {
        if (e) throw new ZeewError("No se Ha Podido Guardar Correctamente. \n Error: " + e);
    })
}

function tienda() {
    let direction = path.dirname(require.main.filename).split("/")
    if (!fs.existsSync(`${direction.join("/")}/zedb`)) {
        mkdirp(`${direction.join("/")}/zedb`, (e) => {
            if (e) throw new ZeewError("No se pudo crear la carpeta zedb para guardar las bases de datos de la tienda")
        })
        console.log("[Zeew.Economia]".green+" Se creo la Carpeta zedb correctamente, aqui se guardaran los datos de la tienda.")
    }
    if (!fs.existsSync('./zedb/tienda.json')) {
        fs.writeFileSync('./zedb/tienda.json', JSON.stringify({}, null, 2), {
            flag: 'wx'
        }, function (err) {
            if (err) throw new ZeewError(`No se Creo la base de datos de la tienda.\n error: ${err}`)
        });
        console.log("[Zeew.Economia]".green+"Base de Datos de Economia Creado Correctamente".cyan)
    }
}

function agregar(clave, name, desc, price) {
    let db = require(`${appdir}/zedb/tienda.json`)

    if (!clave) throw new ZeewError("Agrega Una Clave / ID del servidor".yellow)
    if (!name) throw new ZeewError("Debes Colocar el Nombre del Item".yellow)
    if (!desc) throw new ZeewError("Debes Colocar el descripcion del Item".yellow)
    if (!price) throw new ZeewError("Debes Colocar el precio del Item".yellow)
    if (isNaN(price)) throw new ZeewError("Debes Colocar un Numero".yellow)

    if( typeof clave != "string") throw new ZeewError("La Clave / ID del servidor tiene que ser un string".yellow)
    if (typeof name != "string") throw new ZeewError("Tiene que ser un string / texto".yellow)
    if (typeof desc != "string") throw new ZeewError("Tiene que ser un string / texto".yellow)
    price = Number(price)

    if (!db[clave]) {
        db[clave] = {
            nombre: {
                "item1": name
            },
            descripcion: {
                "item1": desc
            },
            precio: {
                "item1": price
            }
        }
        save(db)
    } else {

        let id = 1;
        let existe = "no"
        for (let e in db[clave].nombre) {
            if (db[clave].nombre[e].toLowerCase() == name.toLowerCase()) {
                existe = "si"
            }
            id += 1;
        }

        if (existe == "si") return `El Articulo : [${name}] , Ya Existe.`

        let item = `item${id}`
        db[clave].nombre[item] = name
        db[clave].descripcion[item] = desc
        db[clave].precio[item] = price

        save(db)
    }

    return `El Articulo: ${name} Con el valor de ${price} \n Y su Descripcion ${desc} \nAgregado Correctamente.`

}

function quitar(clave, id) {
    let db = require(`${appdir}/zedb/tienda.json`)

    if (!clave) throw new ZeewError("Debe Intrudicir una clave / nombre  / servidor".yellow)
    if (!id) throw new ZeewError("Debes Introducir el numero del item que quieres eliminar".yellow)
    if (isNaN(id)) throw new ZeewError("Tiene que ser un numero")
    if( typeof clave != "string") throw new ZeewError("La Clave / ID del servidor tiene que ser un string".yellow)

    let iditem = id;
    let tienda = db[clave]
    let n = 0;

    let item = `item${iditem}`

    if (!db[clave].nombre[item]) {
        return "No hay ningun item con ese numero"
    }

    tienda.nombre[item] = false;
    tienda.descripcion[item] = false;
    tienda.precio[item] = false;

    for (let x in tienda.nombre) {
        if (tienda.nombre[x] != false && n != 0) {

            tienda.nombre[n] = tienda.nombre[x]
            tienda.descripcion[n] = tienda.descripcion[x]
            tienda.precio[n] = tienda.precio[x]

            tienda.nombre[x] = false;
            tienda.descripcion[x] = false;
            tienda.precio[x] = false;

            n = x
        }
        if (tienda.nombre[x] == false) {
            n = x
        }
    }

    for (let e in tienda.nombre) {
        if (tienda.nombre[e] == false) {
            delete tienda.nombre[e];
            delete tienda.descripcion[e];
            delete tienda.precio[e];
        }
    }
    save(db)
    return "Eliminado Correctamente"
}

function mostrar(clave){
    let db = require(`${appdir}/zedb/tienda.json`)
    if(!clave) throw new ZeewError("Ingresa una clave / ID del servidor".cyan);


    let tienda = db[clave];
    let id = 0;
    let msg = ""
    if(!tienda) return "No hay una tienda"
    for(let i in tienda.nombre){
        id++;
        msg += `Nombre: ${tienda.nombre[i]}. \nDescripcion: ${tienda.descripcion[i]}.\nPrecio: $${tienda.precio[i]} \nID: ${id}\n`
    }
    return msg;
}

function eliminar(clave){
    let db = require(`${appdir}/zedb/tienda.json`)
    if(!clave) throw new ZeewError("Ingresa una clave / ID del servidor".cyan);

    if(!db[clave]){
        return "No existe en la db"
    }

    delete db[clave]
    save(db)
    return "Tienda eliminada"
}
tienda.prototype.agregar = agregar;
tienda.prototype.quitar = quitar;
tienda.prototype.mostrar = mostrar;
tienda.prototype.eliminar = eliminar;