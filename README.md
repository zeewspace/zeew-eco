![Zeew Api](https://i.imgur.com/MP2bABn.png "Lo Mejor de Zeew")

# ¡ZeewEco!

- Economía Fácil y sencilla!
- Tienda fácil de crear e intuitiva!

¡Crea una economía fácil y sencilla de usar para tu bot, ahora con ZeewEco!
¡Lo unico que necesitas en una base de datos de MongoDB!

## Informacion

- **Constructores**
  - [Economía](#economia)
  - [Tienda](#tienda)
  - [Inventario](#inventario)
  - [Banco](#banco)
- **Informacion Sobre Zeew**
  - [Staff](#staff)
  - [Proyectos](#proyectos)

No olvides que si tienes un error o propuesta para mejorar este NPM, solo tienes que unirte a este servidor de [Discord](https://discord.gg/KnuCvHvrfG).

¡Gracias por confiar en Zeew!

## Instalación y Configuración del NPM

```js
npm i zeew-eco
```

Tus primeras lineas de codigo deberan ser asi:

```js
const zeeweco = require("zeew-eco");
new zeeeco.Options("URL MONGO");
```

**¡OJO! El constructor "Options" solo se debe usar 1 vez, se debe colocar en el archivo principal**

### Economia

```js
const zeeweconomy = require("zeew-eco");
const eco = new zeeweconomy.Economia();
```

| Métodos                     | Descripción                         |
| --------------------------- | ----------------------------------- |
| [ver](#Eco-ver)             | Muestra el dinero del usuario       |
| [agregar](#Eco-agregar)     | Agrega dinero aun usuario           |
| [remover](#Eco-remover)     | Elimina el dinero de un usuario     |
| [reiniciar](#Eco-reiniciar) | Reiniciar la economia               |
| [comprar](#Eco-comprar)     | Comprar en la tienda                |
| [trabajar](#Eco-trabajar)   | Ganar una cantidad de dinero RANDOM |

#### Economia: Ver

```js
eco.ver(id, clave);
```

- id - ID del usuario
- clave - ID del servidor

```js
const eco = new zeeweconomy.Economia();
eco.ver(miembro.id, servidor.id);
```

Retorno (Number)

```js
10;
```

#### Economia: Agregar

```js
eco.agregar(id, clave, cantidad);
```

- id - ID del usuario
- clave - ID del servidor
- cantidad - Dinero que quieras agregarle

```js
const eco = new zeeweconomy.Economia();
eco.agregar(miembro.id, servidor.id, 1500);
```

Retorno (Number)

```js
1500;
```

#### Economia: Remover

```js
eco.remover(id, clave, cantidad);
```

- id - ID del usuario
- clave - ID del servidor
- cantidad - Dinero que quieras agregarle

```js
const eco = new zeeweconomy.Economia();
eco.remover(miembro.id, servidor.id, 1500);
```

Retorno (Number)

```js
0;
```

#### Economia: Reiniciar

```js
eco.reiniciar(id, clave);
```

- id - ID del usuario
- clave - ID del servidor
-

```js
const eco = new zeeweconomy.Economia();
eco.reiniciar(miembro.id, servidor.id);
```

Retorno (Boolean)

```js
true;
```

#### Economia: Comprar

```js
eco.comprar(user, clave, id);
```

- user - ID del usuario
- clave - ID del servidor
- id - ID del producto en Tienda

```js
const eco = new zeeweconomy.Economia();
eco.comprar(miembro.id, servidor.id, idproducto);
```

Retorno:

```js
item: {
  name, price, id, role;
}
money; // Dinero antes de comprar
newmoney; // Dinero despues de comprar
```

#### Economia: Trabajar

```js
eco.trabajar(id, clave, cantidad);
```

- id - ID del usuario
- clave - ID del servidor
- cantidad - Cantidad maxima aleatoria

```js
const eco = new zeeweconomy.Economia();
eco.trabajar(miembro.id, servidor.id, 1500);
```

Retorno (Number):

```js
CANTIDAD RANDOM
```

### Tienda

```js
const zeeweconomy = require("zeew-eco");
const td = new zeeweconomy.Tienda();
```

| Metodos                    | Descripcion                |
| -------------------------- | -------------------------- |
| [ver](#TD-ver)             | Muestra Items a la tienda  |
| [agregar](#TD-agregar)     | Agrega Items a la tienda   |
| [remover](#TD-remover)     | Elimina Items de la tienda |
| [reiniciar](#TD-reiniciar) | Elimina Items de la tienda |

#### Tienda: Ver

```js
eco.ver(clave);
```

- clave - ID del servidor

```js
const td = new zeco.tienda();
eco.ver(servidor.id);
```

Retorno:

```js
[{ id, name, description, price, isRole, role }];
```

#### Tienda: Agregar

```js
eco.agregar(clave, nombre, desc, precio, isRole, role);
```

- clave - ID del servidor
- nombre - Nombre del Item
- desc - La descripcion del item
- precio - el precio del item
- isRole - Boolean de si es o no un rol
- role - ID del rol

```js
const td = new zeco.tienda();
td.agregar(servidor.id, "Canal Propio", "un canal privado para ti", 20000);
```

Retorno:

```js
{
  idname, description, price, isRole, role;
}
```

#### Tienda: Remover

```js
td.remover(clave, item);
```

- clave -ID del servidor
- item - ID del iten de la tienda

```js
const td = new zeco.tienda();
td.remover(servidor.id, 1);
```

Retorno (Booleano)

```js
true;
```

#### Tienda: Reiniciar

```js
td.reiniciar(clave);
```

- clave -ID del servidor

```js
const td = new zeco.tienda();
td.reiniciar(servidor.id);
```

Retorno (Booleano)

```js
true;
```

### Inventario

```js
const zeeweconomy = require("zeew-eco");
const inventario = new zeeweconomy.Inventario();
```

| Metodos       | Descripcion                               |
| ------------- | ----------------------------------------- |
| [Ver](#v-ver) | Ver los objetos comprados desde la tienda |

#### Inventario: Ver

```js
inv.ver(clave, user);
```

- clave - ID del servidor
- user - ID del usuario

```js
const inv = new zeco.inventario();
inv.ver(servidor.id, usuario.id);
```

Retorno (Booleano)

```js
[{ id, name }];
```

### Banco

```js
const zeeweconomy = require("zeew-eco");
const banco = new zeeweconomy.Banco();
```

| Metodos                    | Descripcion                    |
| -------------------------- | ------------------------------ |
| [ver](#ba-ver)             | Muestra dinero del banco       |
| [agregar](#ba-agregar)     | Agrega una cantidad de dinero  |
| [remover](#ba-remover)     | remover una cantidad de dinero |
| [reiniciar](#ba-reiniciar) | Elimina el banco del usaurio   |
| [depositar](#ba-depositar) | Deposita dinero al banco       |
| [retirar](#ba-retirar)     | Retira dinero del banco        |

#### Banco: Ver

```js
banco.ver(user, guild);
```

- user - ID del usuario
- guild - ID del servidor

#### Banco: agregar

```js
banco.agregar(user, guild, money);
```

- user - ID del usuario
- guild - ID del servidor
- money - cantidad de dinero a agregar del banco.

#### Banco: remover

```js
banco.remover(user, guild, money);
```

- user - ID del usuario
- guild - ID del servidor
- money - cantidad de dinero a remover del banco.

#### Banco: reiniciar

```js
banco.reiniciar(user, guild);
```

- user - ID del usuario
- guild - ID del servidor

#### Banco: depositar

```js
banco.depositar(user, guild, money);
```

- user - ID del usuario
- guild - ID del servidor
- money - cantidad de dinero a depositar (remover dinero y agregar banco automatico)

#### Banco: retirar

```js
banco.retirar(user, guild, money);
```

- user - ID del usuario
- guild - ID del servidor
- money - cantidad de dinero a depositar (remover dinero y agregar banco automatico)

#### ¡Staff de Zeew!

- @KamerrEzz

```
  * ROL: Owner
  * ID Discord: 403695999941345280
  * Redes Sociales: @KamerrOficial
  * Portafolio: behance.net/kamerroficial
```

- @LHCLYT

```
  * ROL: Editor de README & Amigo
  * ID Discord: 478572042384572424
  * Proyecto: https://cactusfire.xyz
  * Discord: https://discord.gg/73AMGUZ
```

#### Proyectos de Zeew

| Proyecto                                   | Descripción                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| [ZEEW](https://www.npmjs.com/package/zeew) | Descubre nuestra API Reset de Imágenes y manipulación |

```js

```

#### Donaciones

- [Kamerr Ko-fi](https://ko-fi.com/kamerroficial) ❤️
- [PayPal](https://www.paypal.com/donate/?hosted_button_id=MAB5M68DJG5PQ&source=url) ❤️

#### ¡Ejemplo de Bot en Discord.js!

- Ejemplo de Agregar dinero a un usuario!
- Evidemente le puedes añadir mas condicionales...

```js
const zeeweconomy = require('zeew-eco')
module.exports.run...

let dinero = args[0]
if(!dinero) return;

const eco = new zeeweconomy.Economia()
eco.agregar(miembro.id, servidor.id, dinero)
message.channel.send("Se ha agregado correctamente "+dinero+" al usuario: "+message.author.username
```