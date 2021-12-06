![Zeew Api](https://i.imgur.com/MP2bABn.png "Lo Mejor de Zeew")

# Zeew Eco

- [Zeew Eco](#zeew-eco)
  - [Información](#información)
    - [Proximamente](#proximamente)
    - [Actualizaciones](#actualizaciones)
    - [Proyectos](#proyectos)
  - [Instalación y uso del modulo](#instalación-y-uso-del-modulo)
  - [Modulos](#modulos)
    - [Economia](#economia)
      - [Eco: Ver](#eco-ver)
      - [Eco: Agregar](#eco-agregar)
      - [Eco: Remover](#eco-remover)
      - [Eco: Reiniciar](#eco-reiniciar)
      - [Eco: Comprar](#eco-comprar)
      - [Eco: Trabajar](#eco-trabajar)
    - [Tienda](#tienda)
      - [Tienda: Ver](#tienda-ver)
      - [Tienda: Agregar](#tienda-agregar)
      - [Tienda: Remover](#tienda-remover)
      - [Tienda: Reiniciar](#tienda-reiniciar)
    - [Inventario](#inventario)
      - [Inventario: Ver](#inventario-ver)
      - [Inventario: Item](#inventario-item)
      - [Inventario: Agregar](#inventario-agregar)
      - [Inventario: Remover](#inventario-remover)
      - [Inventario: Reiniciar](#inventario-reiniciar)
    - [Banco](#banco)
      - [Banco: Ver](#banco-ver)
      - [Banco: agregar](#banco-agregar)
      - [Banco: remover](#banco-remover)
      - [Banco: reiniciar](#banco-reiniciar)
      - [Banco: depositar](#banco-depositar)
      - [Banco: retirar](#banco-retirar)

## Información

¡De devs para devs!

Olvidate de hacer todas las validaciones, condiciones para crear la economia para tu proyecto.

Yo se que puede ser complicado crear una economia para tu bot de discord o incluso
ahorar el tiempo en hacerlo. Por eso he creado este modulo que te ayudara a hacerlo
en tampoco tiempo.

No olvides que si tienes un error o propuesta para mejorar este NPM, solo tienes que unirte a este servidor de [Discord](discord.gg/6tCdxshm9w).

### Proximamente

* Opciones para cambiar la base de datos. MYSQL, SQLITE, MONGODB.
* Implementacion con cards usando zeew api.

### Actualizaciones

* Documentacion Actualizada.
* Links Arreglados
* Ejemplos Arreglados

### Proyectos

| Proyecto                                   | Descripción                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| [ZEEW](https://www.npmjs.com/package/zeew) | Descubre nuestra API Reset de Imágenes y manipulación |

## Instalación y uso del modulo

Ya sabes el modo de instarlos, simplemente `npm install --save zeew-eco`.

Para crear la conexion a la base de datos simplemente debes hacer esto.
Pero recuerda que la opcion `Options` solo hace conexion a la base de datos de mongodb, si ya tienes una conexion, no la uses. Tambien solo se debe usar una vez para evitar multiples conexiones a la misma base de datos.

```js
    const zeeweco = require("zeew-eco");
    new zeeeco.Options("URL MONGO");
```

En los modulos podras ver las funciones que puedes usar.
Por ejemplo `Economia` esta traera varias funciones que podras usar
para hacer tu economia. Te doy un ejemplo de una de ellas.

```js
const zeeweconomy = require("zeew-eco");
// Modulo de Zeew Eco
const Economia = new zeeweconomy.Economia();

//Funcion para ver la economia de un usuario
const verEconomia = await Economia.ver(miembro, servidor);
console.log(verEconomia)

```

Todas las funciones son promesas, asi que no olvides usar `await` y `async`

## Modulos

### Economia

```js
const zeeweconomy = require("zeew-eco");
const eco = new zeeweconomy.Economia();
```

| Métodos   | Descripción                         |
| --------- | ----------------------------------- |
| ver       | Muestra el dinero del usuario       |
| agregar   | Agrega dinero aun usuario           |
| remover   | Elimina el dinero de un usuario     |
| reiniciar | Reiniciar la economia               |
| comprar   | Comprar en la tienda                |
| trabajar  | Ganar una cantidad de dinero RANDOM |

#### Eco: Ver

Mira el dinero de un usuario en un servidor.

- Parametros:
  - ID del usuario
  - ID del servidor
- Retorna:
  - La cantidad de dinero del usuario en el servidor

```js
const eco = new zeeweconomy.Economia();
eco.ver(miembro.id, servidor.id);
```

#### Eco: Agregar

Agregar dinero a un usaurio en un servidor.

- Parametros:
  - ID del usuario
  - ID del servidor
  - Cantidad de dinero a agregar
- Retorna:
  - La cantidad de dinero del usuario en el servidor

```js
const eco = new zeeweconomy.Economia();
eco.agregar(miembro.id, servidor.id, 1500);
```

#### Eco: Remover

- Parametros:
  - ID del usuario
  - ID del servidor
  - Cantidad de dinero a remover
- Retorna:
  - La cantidad de dinero del usuario en el servidor

```js
const eco = new zeeweconomy.Economia();
eco.remover(miembro.id, servidor.id, 1500);
```

#### Eco: Reiniciar

Elimina todo el dinero del usuario.

- Parametros:
  - ID del usuario
  - ID del servidor
- Retorna:
  - True o false depediendo si se cumplio o no

```js
const eco = new zeeweconomy.Economia();
eco.reiniciar(miembro.id, servidor.id);
```

#### Eco: Comprar

Comprar dinero en la tienda.

- Parametros:
  - ID del usuario
  - ID del servidor
  - ID del item
- Retorna:
  - 
    ```js
        {
          item, // Item comprado
          money, // Cantidad de dinero
          newmoney, // Cantidad de dinero actualizado
        }
    ```

```js
const eco = new zeeweconomy.Economia();
eco.comprar(miembro.id, servidor.id, idproducto);
```

#### Eco: Trabajar

Agrega dinero aleatorio al usaurio, como si fuera trabajando.
`Tu tienes que hacer el cooldown de la economia.`

- Parametros:
  - ID del usuario
  - ID del servidor
  - Cantidad maxima que se puede ganar.
- Retorna:
  - El dinero ganado

```js
const eco = new zeeweconomy.Economia();
eco.trabajar(miembro.id, servidor.id, 1500);
```

### Tienda

```js
const zeeweconomy = require("zeew-eco");
const td = new zeeweconomy.Tienda();
```

| Metodos   | Descripcion                |
| --------- | -------------------------- |
| ver       | Muestra Items a la tienda  |
| agregar   | Agrega Items a la tienda   |
| remover   | Elimina Items de la tienda |
| reiniciar | Elimina Items de la tienda |

#### Tienda: Ver

- Parametros:
  - ID del servidor
- Retorna:
  - Un array con los items que hay en la tienda
  - 
  ```js
    [{ id, name, description, price, isRole, role }];
  ```

```js
const td = new zeco.tienda();
eco.ver(servidor.id);
```

#### Tienda: Agregar

- Parametros:
  - ID del servidor
  - Nombre del Item
  - La descripcion del item
  - el precio del item
  - Boolean de si es o no un rol
  - ID del rol
- Retorna:
  - Retorna la ID del item creado
  ```

```js
const td = new zeco.tienda();
td.agregar(servidor.id, "Canal Propio", "un canal privado para ti", 20000, false, false,);
```

#### Tienda: Remover
- Parametros:
  - ID del servidor
  - ID del item
- Retorna:
  - True o false depediendo si se cumplio o no
  
```js
const td = new zeco.tienda();
td.remover(servidor.id, 1);
```

#### Tienda: Reiniciar

- Parametros:
  - ID del servidor
  - ID del item
- Retorna:
  - True o false depediendo si se cumplio o no

```js
const td = new zeco.tienda();
td.reiniciar(servidor.id);
```

### Inventario

```js
const zeeweconomy = require("zeew-eco");
const inventario = new zeeweconomy.Inventario();
```

| Metodos   | Descripcion                               |
| --------- | ----------------------------------------- |
| Ver       | Ver los objetos comprados desde la tienda |
| Item      | Ver un item del inventario                |
| Agregar   | Agregar un item al inventario             |
| Remover   | Remover un item del inventario            |
| Reiniciar | Elimina invetario del usuario             |

#### Inventario: Ver

- Parametros:
  - ID del servidor
  - ID del usaurio
- Retorna:
  - Un array con los objetos que hay en el inventario
  - 
    ```js
        [{ id, name }];
    ```

```js
const inv = new zeco.inventario();
inv.ver(usuario.id, servidor.id);
```

#### Inventario: Item

- Parametros:
  - ID del usuario
  - ID del servidor
  - ID del Item
- Retorna:
  - Un objeto con los datos del item
  - 
    ```js
        { id, name, item };
    ```

```js
const inv = new zeco.inventario();
inv.item(usuario.id, servidor.id, "asd23g34");
```

#### Inventario: Agregar

- Parametros:
  - ID del usaurio
  - ID del servidor
  - Nombre
  - Item, rol, dinero, etc.
- Retorna:
  - Un objeto del nuevo item
  - 
    ```js
        {id , name , item}
    ```

```js
const inv = new zeco.inventario();
inv.agregar(usuario.id, servidor.id, "Obten 100$", 100);
```

#### Inventario: Remover

- Parametros:
  - ID del usuario
  - ID del servidor
  - ID del item
- Retorna:
  - Retorna true si se elimina el item, false si no existe el item

```js
const inv = new zeco.inventario();
inv.remover(usuario.id, servidor.id, "asd23g34");
```

#### Inventario: Reiniciar

- Parametros:
  - ID del usuario
  - ID del servidor
  - ID del item
- Retorna:
  - Retorna true si se elimina el item, false si no existe el item

```js
const inv = new zeco.inventario();
inv.reiniciar(usuario.id, servidor.id);
```

### Banco

```js
const zeeweconomy = require("zeew-eco");
const banco = new zeeweconomy.Banco();
```

| Metodos   | Descripcion                    |
| --------- | ------------------------------ |
| Ver       | Muestra dinero del banco       |
| agregar   | Agrega una cantidad de dinero  |
| remover   | remover una cantidad de dinero |
| reiniciar | Elimina el banco del usaurio   |
| depositar | Deposita dinero al banco       |
| retirar   | Retira dinero del banco        |

#### Banco: Ver

- Parametros:
  - ID del user
  - ID del servidor
- Retorna:
  - El dinero del banco

```js
banco.ver(user.id, servidor.id);
```

#### Banco: agregar

- Parametros:
  - ID del user
  - ID del servidor
- Retorna:
  - El dinero del banco

```js
banco.agregar(user.id, servidor.id, 500);
```

#### Banco: remover

- Parametros:
  - ID del user
  - ID del servidor
- Retorna:
  - El dinero del banco

```js
banco.remover(user.id, servidor.id, 500);
```

#### Banco: reiniciar

- Parametros:
  - ID del user
  - ID del servidor
- Retorna:
  - El dinero del banco

```js
banco.reiniciar(user.id, servidor.id);
```

#### Banco: depositar

- Parametros:
  - ID del user
  - ID del servidor
  - Cantidad de dinero a depositar
- Retorna:
  - El dinero del banco

```js
banco.depositar(user.id, servidor.id, 500);
```

#### Banco: retirar

- Parametros:
  - ID del user
  - ID del servidor
  - Cantidad de dinero a depositar
- Retorna:
  - El dinero del banco

```js
banco.retirar(user.id, servidor.id, 500);
```