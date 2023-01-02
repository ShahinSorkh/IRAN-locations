const path = require('path')
const fs = require('fs')
const { escapeId, format } = require('sqlstring')

const notEmpty = arr => arr.length > 0

const dataFilename = path.resolve(__dirname, '..', 'dist', 'data.json')
const { provinces } = JSON.parse(fs.readFileSync(dataFilename, { encoding: 'utf8' }))

const [provincesTable, citiesTable, areasTable] = [
  escapeId('provinces'),
  escapeId('cities'),
  escapeId('areas')
]

const provinceObjs = provinces.flatMap(p => ([[p.id, p.name]]))
const cityObjs = provinces.flatMap(p => p.cities.map(c => ([Number(c.id), c.name, p.id])).filter(notEmpty)).filter(notEmpty)
const areaObjs = provinces.flatMap(
  p => p.cities.flatMap(c => c.areas.map(a => ([Number(a.id), a.name, Number(c.id)])).filter(notEmpty)).filter(notEmpty)
).filter(notEmpty)

const createSchemaSql = `
CREATE TABLE IF NOT EXISTS ${provincesTable} (
    ${escapeId('id')} CHAR(3) PRIMARY KEY,
    ${escapeId('name')} VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS ${citiesTable} (
    ${escapeId('id')} INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    ${escapeId('province_id')} CHAR(3) NOT NULL,
    ${escapeId('name')} VARCHAR(150) NOT NULL,
    FOREIGN KEY (${escapeId('province_id')}) REFERENCES ${escapeId('provinces')}(${escapeId('id')})
         ON DELETE CASCADE
         ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ${areasTable} (
    ${escapeId('id')} INT UNSIGNED,
    ${escapeId('city_id')} INT UNSIGNED NOT NULL,
    ${escapeId('name')} VARCHAR(150) NOT NULL,
    PRIMARY KEY (${escapeId('id')}, ${escapeId('city_id')}),
    FOREIGN KEY (${escapeId('city_id')}) REFERENCES ${escapeId('cities')}(${escapeId('id')})
         ON DELETE CASCADE
         ON UPDATE CASCADE
);
`

const insertProvincesSql = format(
  `INSRET INTO ${provincesTable} (${escapeId('id')}, ${escapeId('name')}) VALUES ?;`,
  [provinceObjs]
)
const insertCitiesSql = format(
  `INSRET INTO ${citiesTable} (${escapeId('id')}, ${escapeId('name')}, ${escapeId('province_id')}) VALUES ?;`,
  [cityObjs]
)
const insertAreasSql = format(
  `INSRET INTO ${areasTable} (${escapeId('id')}, ${escapeId('name')}, ${escapeId('city_id')}) VALUES ?;`,
  [areaObjs]
)

const sqlFilename = path.resolve(__dirname, '..', 'dist', 'provinces.cities.areas.sql')
fs.writeFileSync(
  sqlFilename,
  `${createSchemaSql}\n\n${insertProvincesSql}\n${insertCitiesSql}\n${insertAreasSql}`
)
