import L from 'leaflet'
import proj4 from 'proj4'

export const BRITISH_NATIONAL_GRID_DEFINITION =
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs'

proj4.defs('EPSG:27700', BRITISH_NATIONAL_GRID_DEFINITION)

const gridLetters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'

export type GridDigits = 4 | 6 | 8 | 10
export type GridSpacing = 500 | 1000 | 2000 | 5000 | 10000

type GridPoint = {
  easting: number
  northing: number
}

export const ukMapLocations = [
  { name: 'Snowdonia', coordinates: [53.0686, -3.8296] as L.LatLngExpression },
  { name: 'Peak District', coordinates: [53.3449, -1.8365] as L.LatLngExpression },
  { name: 'Lake District', coordinates: [54.4609, -3.0886] as L.LatLngExpression },
  { name: 'New Forest', coordinates: [50.8776, -1.6243] as L.LatLngExpression },
  { name: 'Richmond Park', coordinates: [51.4409, -0.2758] as L.LatLngExpression },
  { name: 'Welshmill Scout Hut (Frome)', coordinates: [51.23618, -2.32009] as L.LatLngExpression },
] as const

export const latLngToBritishGrid = (latLng: L.LatLng | L.LatLngLiteral): GridPoint => {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:27700', [latLng.lng, latLng.lat])
  return { easting, northing }
}

export const britishGridToLatLng = ({ easting, northing }: GridPoint) => {
  const [lng, lat] = proj4('EPSG:27700', 'EPSG:4326', [easting, northing])
  return L.latLng(lat, lng)
}

export const britishGridRef = ({ easting, northing }: GridPoint, digits: GridDigits = 8) => {
  const letters = getGridLetters(easting, northing)
  const precision = digits / 2
  const divisor = 10 ** (5 - precision)
  const east = Math.floor(((easting % 100000) + 100000) % 100000 / divisor)
    .toString()
    .padStart(precision, '0')
  const north = Math.floor(((northing % 100000) + 100000) % 100000 / divisor)
    .toString()
    .padStart(precision, '0')

  return `${letters} ${east} ${north}`
}

function getGridLetters(easting: number, northing: number) {
  const e100k = Math.floor(easting / 100000)
  const n100k = Math.floor(northing / 100000)

  if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12) {
    return '??'
  }

  let first = (19 - n100k) - ((19 - n100k) % 5) + Math.floor((e100k + 10) / 5)
  let second = ((19 - n100k) * 5) % 25 + (e100k % 5)

  if (first > 7) {
    first += 1
  }

  if (second > 7) {
    second += 1
  }

  return `${gridLetters[first]}${gridLetters[second]}`
}