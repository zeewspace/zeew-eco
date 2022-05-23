 /**
 * [pathType Saber el tipo de path recibido: carpeta o archivos]
 * @param  {[Array]} path [Los directorios de los archivos/carpetas]
 * @return {[Array]} [Los tipos con los directorios]
 */

function pathType(path) {
  let result = []

  for (let pathway of path.values()) {
      if (pathway.endsWith('.sqlite')) result.push({type: 'file', path: pathway})
      else result.push({type: 'directory', path: pathway})
    }

  return result
}

module.exports = pathType
