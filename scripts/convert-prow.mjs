/**
 * Converts the Somerset PRoW shapefile (EPSG:27700) to WGS84 GeoJSON
 * and writes it to public/somerset-prow.geojson.
 *
 * Usage: node scripts/convert-prow.mjs
 */

import { open } from 'shapefile'
import { createWriteStream } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import proj4 from 'proj4'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SHP = resolve(root, 'Rights of Way GIS files', 'Paths_Mar26_polyline.shp')
const DBF = resolve(root, 'Rights of Way GIS files', 'Paths_Mar26_polyline.dbf')
const OUT = resolve(root, 'public', 'somerset-prow.geojson')

proj4.defs(
  'EPSG:27700',
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs',
)

const toWgs84 = (coord) => proj4('EPSG:27700', 'EPSG:4326', coord)

function convertGeometry(geom) {
  if (!geom) return null
  if (geom.type === 'LineString') {
    return { ...geom, coordinates: geom.coordinates.map(toWgs84) }
  }
  if (geom.type === 'MultiLineString') {
    return { ...geom, coordinates: geom.coordinates.map((ring) => ring.map(toWgs84)) }
  }
  return geom
}

const out = createWriteStream(OUT, 'utf8')
out.write('{"type":"FeatureCollection","features":[\n')

let first = true
let count = 0

const source = await open(SHP, DBF)

// eslint-disable-next-line no-constant-condition
while (true) {
  const { done, value: feature } = await source.read()
  if (done) break

  const p = feature.properties ?? {}
  const converted = {
    type: 'Feature',
    geometry: convertGeometry(feature.geometry),
    properties: {
      status: p.LINKSTATUS ?? null,
      ref: p.PATH_NO ?? null,
      name: p.PATH_NAME ?? null,
    },
  }

  out.write((first ? '' : ',\n') + JSON.stringify(converted))
  first = false
  count++
}

out.write('\n]}\n')
out.end()

console.log(`Done — wrote ${count} features to public/somerset-prow.geojson`)
