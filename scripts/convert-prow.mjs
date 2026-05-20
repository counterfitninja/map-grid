/**
 * Converts local PRoW shapefiles (EPSG:27700) to WGS84 GeoJSON outputs.
 *
 * Outputs:
 * - public/somerset-prow.geojson
 * - public/wiltshire-prow.geojson
 * - public/banes-prow.geojson
 *
 * Usage: node scripts/convert-prow.mjs
 */

import { open } from 'shapefile'
import { createWriteStream } from 'fs'
import { access, readdir, readFile, stat, unlink, writeFile } from 'fs/promises'
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import proj4 from 'proj4'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const mapshaperCli = resolve(root, 'node_modules', 'mapshaper', 'bin', 'mapshaper')

const DATASETS = [
  {
    id: 'somerset',
    label: 'Somerset definitive PRoW',
    out: resolve(root, 'public', 'somerset-prow.geojson'),
    sourceFiles: {
      shp: resolve(root, 'Rights of Way GIS files', 'Paths_Mar26_polyline.shp'),
      dbf: resolve(root, 'Rights of Way GIS files', 'Paths_Mar26_polyline.dbf'),
      shx: resolve(root, 'Rights of Way GIS files', 'Paths_Mar26_polyline.shx'),
    },
  },
  {
    id: 'wiltshire',
    label: 'Wiltshire definitive PRoW',
    out: resolve(root, 'public', 'wiltshire-prow.geojson'),
    sourceDir: resolve(root, 'Rights of Way GIS files', 'Wiltshire Definitive PRoW'),
  },
  {
    id: 'banes',
    label: 'Bath and North East Somerset PRoW',
    out: resolve(root, 'public', 'banes-prow.geojson'),
    sourceDir: resolve(root, 'Rights of Way GIS files', 'Bath and North East Somerset PRoW'),
  },
]

proj4.defs(
  'EPSG:27700',
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs',
)

const toWgs84 = (coord) => proj4('EPSG:27700', 'EPSG:4326', coord)

const banesStatusCodeMap = {
  Fo: 'Footpath',
  Br: 'Bridleway',
  Re: 'Restricted byway',
  BO: 'Byway open to all traffic',
}

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

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

const normalizeProwStatus = (rawStatus, description) => {
  if (typeof rawStatus === 'string' && rawStatus.trim()) {
    const value = rawStatus.trim()
    const lower = value.toLowerCase()
    const upper = value.toUpperCase()

    if (upper in banesStatusCodeMap) {
      return banesStatusCodeMap[upper]
    }

    if (['FP', 'FOOTPATH'].includes(upper) || lower.includes('footpath')) {
      return 'Footpath'
    }
    if (['BW', 'BRIDLEWAY'].includes(upper) || lower.includes('bridleway')) {
      return 'Bridleway'
    }
    if (['RB', 'RESTRICTED BYWAY'].includes(upper) || lower.includes('restricted byway')) {
      return 'Restricted byway'
    }
    if (['BOAT', 'BYWAY OPEN TO ALL TRAFFIC'].includes(upper) || lower.includes('byway open to all traffic')) {
      return 'Byway open to all traffic'
    }

    return value
  }

  if (typeof description === 'string' && description.trim()) {
    const code = description.split('|')[0]?.trim()
    if (code in banesStatusCodeMap) {
      return banesStatusCodeMap[code]
    }
  }

  return null
}

const normalizeFeature = (feature) => {
  if (!feature?.geometry) {
    return null
  }

  const p = feature.properties ?? {}
  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties: {
      status: normalizeProwStatus(
        pickFirstString(
          p.status,
          p.STATUS,
          p.LINKSTATUS,
          p.linkstatus,
          p.designation,
          p.DESIGNATION,
          p.row_type,
          p.ROW_TYPE,
          p.TYPE,
          p.type,
        ),
        typeof p.description === 'string' ? p.description : '',
      ),
      ref: pickFirstString(
        p.ref,
        p.REF,
        p.PATH_NO,
        p.path_no,
        p.route_no,
        p.ROUTE_NO,
        p.name,
        p.NAME,
      ),
      name: pickFirstString(
        p.name,
        p.NAME,
        p.PATH_NAME,
        p.path_name,
        p.route_name,
        p.ROUTE_NAME,
      ),
    },
  }
}

const writeFeatureCollection = async (outPath, features) => {
  const collection = {
    type: 'FeatureCollection',
    features,
  }

  await writeFile(outPath, JSON.stringify(collection), 'utf8')
}

const runMapshaperForBanesTabs = async (tabFiles, outPath) => {
  if (!(await fileExists(mapshaperCli))) {
    throw new Error('mapshaper is not installed. Run npm install.')
  }

  const tempOut = `${outPath}.tmp.geojson`
  const args = [
    mapshaperCli,
    '-i',
    ...tabFiles,
    'combine-files',
    '-merge-layers',
    '-proj',
    'wgs84',
    '-o',
    'format=geojson',
    tempOut,
  ]

  const run = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
  })

  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || 'mapshaper conversion failed')
  }

  const raw = JSON.parse(await readFile(tempOut, 'utf8'))
  await unlink(tempOut).catch(() => {})

  const normalizedFeatures = (raw.features ?? [])
    .map((feature) => normalizeFeature(feature))
    .filter(Boolean)

  return normalizedFeatures
}

const downloadBanesFallbackFeatures = async () => {
  const base = 'https://barry.rowmaps.com/jsons/BS/'
  const files = ['mutated1.json', 'mutated2.json', 'mutated3.json', 'mutated4.json']
  const merged = []

  for (const file of files) {
    const response = await fetch(`${base}${file}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${file}: HTTP ${response.status}`)
    }

    const payload = await response.json()
    for (const feature of payload.features ?? []) {
      const normalized = normalizeFeature(feature)
      if (normalized) {
        merged.push(normalized)
      }
    }
  }

  return merged
}

const fileExists = async (path) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const resolveDatasetSource = async (dataset) => {
  if (dataset.sourceFiles) {
    return dataset.sourceFiles
  }

  if (!dataset.sourceDir) {
    return null
  }

  if (!(await fileExists(dataset.sourceDir))) {
    return null
  }

  const entries = await readdir(dataset.sourceDir)
  const shpFile = entries.find((entry) => entry.toLowerCase().endsWith('.shp'))

  if (shpFile) {
    const baseName = shpFile.slice(0, -4)

    return {
      type: 'shapefile',
      shp: resolve(dataset.sourceDir, `${baseName}.shp`),
      dbf: resolve(dataset.sourceDir, `${baseName}.dbf`),
      shx: resolve(dataset.sourceDir, `${baseName}.shx`),
    }
  }

  const tabFiles = entries
    .filter((entry) => entry.toLowerCase().endsWith('.tab'))
    .map((entry) => resolve(dataset.sourceDir, entry))

  if (tabFiles.length > 0) {
    return {
      type: 'mapinfo-tab',
      tabFiles,
    }
  }

  return null
}

const isOutputCurrent = async (outputPath, sourcePaths) => {
  if (!(await fileExists(outputPath))) {
    return false
  }

  const sourceStats = await Promise.all(sourcePaths.map((path) => stat(path)))
  const newestSourceTime = Math.max(...sourceStats.map((entry) => entry.mtimeMs))
  const outStat = await stat(outputPath)
  return outStat.mtimeMs >= newestSourceTime
}

let convertedCount = 0

for (const dataset of DATASETS) {
  const sourceFiles = await resolveDatasetSource(dataset)

  if (!sourceFiles) {
    console.warn(`[${dataset.label}] Source folder/files not found; skipping conversion.`)
    continue
  }

  if (sourceFiles.type === 'mapinfo-tab') {
    const allTabsExist = (await Promise.all(sourceFiles.tabFiles.map((path) => fileExists(path)))).every(Boolean)
    if (!allTabsExist) {
      console.warn(`[${dataset.label}] Missing one or more .tab files; skipping conversion.`)
      continue
    }

    if (await isOutputCurrent(dataset.out, sourceFiles.tabFiles)) {
      console.info(`[${dataset.label}] GeoJSON already up to date; skipping conversion.`)
      continue
    }

    let features = []
    try {
      console.info(`[${dataset.label}] Converting MapInfo TAB files with mapshaper ...`)
      features = await runMapshaperForBanesTabs(sourceFiles.tabFiles, dataset.out)
      if (features.length === 0) {
        throw new Error('MapInfo conversion produced zero geometry features.')
      }
    } catch (error) {
      console.warn(`[${dataset.label}] TAB conversion unavailable (${String(error)}). Falling back to merged BANES GeoJSON feeds.`)
      features = await downloadBanesFallbackFeatures()
    }

    await writeFeatureCollection(dataset.out, features)
    convertedCount++
    console.info(`[${dataset.label}] Done: wrote ${features.length} features.`)
    continue
  }

  const sourcePaths = [sourceFiles.shp, sourceFiles.dbf, sourceFiles.shx]
  const allSourcesExist = (await Promise.all(sourcePaths.map((path) => fileExists(path)))).every(Boolean)

  if (!allSourcesExist) {
    console.warn(`[${dataset.label}] Missing one or more shapefile components (.shp/.dbf/.shx); skipping conversion.`)
    continue
  }

  if (await isOutputCurrent(dataset.out, sourcePaths)) {
    console.info(`[${dataset.label}] GeoJSON already up to date; skipping conversion.`)
    continue
  }

  console.info(`[${dataset.label}] Converting shapefile to ${dataset.out} ...`)

  const out = createWriteStream(dataset.out, 'utf8')
  out.write('{"type":"FeatureCollection","features":[\n')

  let first = true
  let featureCount = 0

  const source = await open(sourceFiles.shp, sourceFiles.dbf)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value: feature } = await source.read()
    if (done) break

    const converted = normalizeFeature({
      ...feature,
      geometry: convertGeometry(feature.geometry),
    })

    if (!converted) {
      continue
    }

    out.write((first ? '' : ',\n') + JSON.stringify(converted))
    first = false
    featureCount++
  }

  out.write('\n]}\n')
  out.end()

  convertedCount++
  console.info(`[${dataset.label}] Done: wrote ${featureCount} features.`)
}

if (convertedCount === 0) {
  console.warn('No datasets converted. Add source shapefiles and re-run npm run convert:prow.')
}
