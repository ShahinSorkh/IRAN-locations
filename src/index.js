const path = require('path')
const fs = require('fs')

const dataFilename = path.resolve(__dirname, '..', 'dist', 'data.json')
const data = JSON.parse(fs.readFileSync(dataFilename, { encoding: 'utf8' }))
const provinces = data.provinces

const provincesql = []
const citysql = []
const areasql = []

for (const province of provinces) {
  provincesql.push(`('${province.id}', '${province.name}')`)
  if (province.cities.length > 0) {
    for (const city of province.cities) {
      citysql.push(`(${city.id}, '${province.id}', '${city.name}')`)
      if (city.areas.length > 0) {
        for (const area of city.areas) {
          areasql.push(`(${area.id}, ${city.id}, '${area.name}')`)
        }
      }
    }
  }
}

let sql = ''

sql += 'CREATE TABLE IF NOT EXISTS provinces (\n'
sql += '    id VARCHAR(3) PRIMARY KEY,\n'
sql += '    name VARCHAR(150) NOT NULL\n'
sql += ');\n\n'

sql += 'CREATE TABLE IF NOT EXISTS cities (\n'
sql += '    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,\n'
sql += '    province_id VARCHAR(3) NOT NULL,\n'
sql += '    name VARCHAR(150) NOT NULL,\n'
sql += '    FOREIGN KEY (province_id) REFERENCES provinces(id)\n'
sql += '         ON DELETE CASCADE\n'
sql += '         ON UPDATE CASCADE\n'
sql += ');\n\n'

sql += 'CREATE TABLE IF NOT EXISTS areas (\n'
sql += '    id INT UNSIGNED,\n'
sql += '    city_id INT UNSIGNED NOT NULL,\n'
sql += '    name VARCHAR(150) NOT NULL,\n'
sql += '    PRIMARY KEY (id, city_id),\n'
sql += '    FOREIGN KEY (city_id) REFERENCES cities(id)\n'
sql += '         ON DELETE CASCADE\n'
sql += '         ON UPDATE CASCADE\n'
sql += ');\n\n'

sql += `INSERT INTO provinces (id,name) VALUES ${provincesql.join(',\n')};\n\n`
sql += `INSERT INTO cities (id,province_id,name) VALUES ${citysql.join(',\n')};\n\n`
sql += `INSERT INTO areas (id,city_id,name) VALUES ${areasql.join(',\n')};\n\n`

const sqlFilename = path.resolve(__dirname, '..', 'dist', 'provinces.cities.areas.sql')
fs.writeFileSync(sqlFilename, sql)
