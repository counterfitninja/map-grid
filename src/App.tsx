import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import L from 'leaflet'
import './App.css'
import {
  britishGridRef,
  britishGridToLatLng,
  latLngToBritishGrid,
  ukMapLocations,
  type GridDigits,
  type GridSpacing,
} from './grid'

type OverlayState = {
  spacingMode: 'auto' | 'manual'
  spacing: GridSpacing
  digits: GridDigits
}

type StoredOsSettings = {
  baseMap: 'osm' | 'os'
  osApiKeysInput: string
  selectedOsKeyIndex: number
  osEndpoint: 'zxy' | 'wmts'
}

const defaultCenter: L.LatLngExpression = [51.229, -2.321]
const osSettingsStorageKey = 'map-grid.os-settings.v1'
const buildVersion = __APP_VERSION__
const buildCommit = __APP_BUILD_COMMIT__
const buildMessage = __APP_BUILD_MESSAGE__
const buildTime = __APP_BUILD_TIME__

const loadStoredOsSettings = (): Partial<StoredOsSettings> => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(osSettingsStorageKey)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Partial<StoredOsSettings>
    return parsed ?? {}
  } catch {
    return {}
  }
}

const getGridSpacingForZoom = (zoom: number): GridSpacing => {
  if (zoom >= 16) {
    return 500
  }

  if (zoom >= 14) {
    return 1000
  }

  if (zoom >= 12) {
    return 2000
  }

  if (zoom >= 10) {
    return 5000
  }

  return 10000
}

class BritishGridOverlay extends L.Layer {
  private mapRef: L.Map | null = null
  private svgElement: SVGSVGElement | null = null
  private groupElement: SVGGElement | null = null
  private spacing: GridSpacing = 1000
  private readonly straightLineZoomThreshold = 13
  private readonly paneName = 'gridPane'

  onAdd(map: L.Map) {
    this.mapRef = map
    const pane = map.getPane(this.paneName) ?? map.createPane(this.paneName)

    pane.style.zIndex = '650'
    pane.style.pointerEvents = 'none'

    if (!pane) {
      return this
    }

    this.svgElement = L.SVG.create('svg') as SVGSVGElement
    this.groupElement = L.SVG.create('g') as SVGGElement
    this.svgElement.classList.add('grid-overlay')
    this.groupElement.classList.add('grid-overlay__group')
    this.svgElement.appendChild(this.groupElement)
    pane.appendChild(this.svgElement)
    map.on('zoomend moveend resize viewreset', this.redraw, this)
    this.redraw()
    return this
  }

  onRemove(map: L.Map) {
    map.off('zoomend moveend resize viewreset', this.redraw, this)

    if (this.svgElement?.parentNode) {
      this.svgElement.parentNode.removeChild(this.svgElement)
    }

    this.mapRef = null
    this.svgElement = null
    this.groupElement = null
    return this
  }

  setSpacing(spacing: GridSpacing) {
    this.spacing = spacing
    this.redraw()
  }

  private getLineAxisValue(value: number) {
    const normalizedValue = ((value % 100000) + 100000) % 100000

    if (this.spacing === 500) {
      return Math.floor(normalizedValue / 100)
        .toString()
        .padStart(3, '0')
    }

    return Math.floor(normalizedValue / 1000)
      .toString()
      .padStart(2, '0')
  }

  private createLinePath(points: L.Point[], northWest: L.Point, className: string) {
    if (points.length < 2) {
      return null
    }

    const path = L.SVG.create('path') as SVGPathElement
    const d = points
      .map((point, index) => {
        const x = point.x - northWest.x
        const y = point.y - northWest.y
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')

    path.setAttribute('d', d)
    path.setAttribute('class', className)
    return path
  }

  private sampleVerticalGridLinePoints(
    map: L.Map,
    easting: number,
    minNorthing: number,
    maxNorthing: number,
  ) {
    if (map.getZoom() <= this.straightLineZoomThreshold) {
      const startPoint = map.latLngToLayerPoint(
        britishGridToLatLng({ easting, northing: minNorthing }),
      )
      const endPoint = map.latLngToLayerPoint(
        britishGridToLatLng({ easting, northing: maxNorthing }),
      )

      if (
        Number.isFinite(startPoint.x) &&
        Number.isFinite(startPoint.y) &&
        Number.isFinite(endPoint.x) &&
        Number.isFinite(endPoint.y)
      ) {
        return [startPoint, endPoint]
      }
    }

    const points: L.Point[] = []
    const sampleStep = Math.max(250, Math.floor(this.spacing / 2))

    for (let northing = minNorthing; northing <= maxNorthing; northing += sampleStep) {
      const layerPoint = map.latLngToLayerPoint(britishGridToLatLng({ easting, northing }))

      if (Number.isFinite(layerPoint.x) && Number.isFinite(layerPoint.y)) {
        points.push(layerPoint)
      }
    }

    if (maxNorthing % sampleStep !== 0) {
      const endPoint = map.latLngToLayerPoint(
        britishGridToLatLng({ easting, northing: maxNorthing }),
      )

      if (Number.isFinite(endPoint.x) && Number.isFinite(endPoint.y)) {
        points.push(endPoint)
      }
    }

    return points
  }

  private sampleHorizontalGridLinePoints(
    map: L.Map,
    northing: number,
    minEasting: number,
    maxEasting: number,
  ) {
    if (map.getZoom() <= this.straightLineZoomThreshold) {
      const startPoint = map.latLngToLayerPoint(
        britishGridToLatLng({ easting: minEasting, northing }),
      )
      const endPoint = map.latLngToLayerPoint(
        britishGridToLatLng({ easting: maxEasting, northing }),
      )

      if (
        Number.isFinite(startPoint.x) &&
        Number.isFinite(startPoint.y) &&
        Number.isFinite(endPoint.x) &&
        Number.isFinite(endPoint.y)
      ) {
        return [startPoint, endPoint]
      }
    }

    const points: L.Point[] = []
    const sampleStep = Math.max(250, Math.floor(this.spacing / 2))

    for (let easting = minEasting; easting <= maxEasting; easting += sampleStep) {
      const layerPoint = map.latLngToLayerPoint(britishGridToLatLng({ easting, northing }))

      if (Number.isFinite(layerPoint.x) && Number.isFinite(layerPoint.y)) {
        points.push(layerPoint)
      }
    }

    if (maxEasting % sampleStep !== 0) {
      const endPoint = map.latLngToLayerPoint(
        britishGridToLatLng({ easting: maxEasting, northing }),
      )

      if (Number.isFinite(endPoint.x) && Number.isFinite(endPoint.y)) {
        points.push(endPoint)
      }
    }

    return points
  }

  private redraw = () => {
    if (!this.mapRef || !this.svgElement || !this.groupElement) {
      return
    }

    const map = this.mapRef
    const bounds = map.getBounds()
    const northWest = map.latLngToLayerPoint(bounds.getNorthWest())
    const southEast = map.latLngToLayerPoint(bounds.getSouthEast())
    const size = southEast.subtract(northWest)

    this.svgElement.style.left = `${northWest.x}px`
    this.svgElement.style.top = `${northWest.y}px`
    this.svgElement.setAttribute('width', `${size.x}`)
    this.svgElement.setAttribute('height', `${size.y}`)
    this.svgElement.setAttribute('viewBox', `0 0 ${size.x} ${size.y}`)
    this.groupElement.replaceChildren()

    const cornerGridPoints = [
      latLngToBritishGrid(bounds.getNorthWest()),
      latLngToBritishGrid(bounds.getNorthEast()),
      latLngToBritishGrid(bounds.getSouthWest()),
      latLngToBritishGrid(bounds.getSouthEast()),
    ]
    const eastings = cornerGridPoints.map((point) => point.easting)
    const northings = cornerGridPoints.map((point) => point.northing)
    const minEasting = Math.floor(Math.min(...eastings) / this.spacing) * this.spacing
    const maxEasting = Math.ceil(Math.max(...eastings) / this.spacing) * this.spacing
    const minNorthing = Math.floor(Math.min(...northings) / this.spacing) * this.spacing
    const maxNorthing = Math.ceil(Math.max(...northings) / this.spacing) * this.spacing

    for (let easting = minEasting; easting <= maxEasting; easting += this.spacing) {
      const points = this.sampleVerticalGridLinePoints(
        map,
        easting,
        minNorthing,
        maxNorthing,
      )

      if (points.length < 2) {
        continue
      }

      const lineClass = easting % 100000 === 0 ? 'grid-line grid-line--major' : 'grid-line'
      const linePath = this.createLinePath(points, northWest, lineClass)

      if (!linePath) {
        continue
      }

      this.groupElement.appendChild(linePath)

      const topPoint = points.reduce((currentTop, point) =>
        point.y < currentTop.y ? point : currentTop,
      )
      const label = L.SVG.create('text') as SVGTextElement
      label.textContent = this.getLineAxisValue(easting)
      label.setAttribute('x', `${topPoint.x - northWest.x + 6}`)
      label.setAttribute('y', '16')
      label.setAttribute('class', 'grid-line-ref')
      this.groupElement.appendChild(label)
    }

    for (
      let northing = minNorthing;
      northing <= maxNorthing;
      northing += this.spacing
    ) {
      const points = this.sampleHorizontalGridLinePoints(
        map,
        northing,
        minEasting,
        maxEasting,
      )

      if (points.length < 2) {
        continue
      }

      const lineClass = northing % 100000 === 0 ? 'grid-line grid-line--major' : 'grid-line'
      const linePath = this.createLinePath(points, northWest, lineClass)

      if (!linePath) {
        continue
      }

      this.groupElement.appendChild(linePath)

      const leftPoint = points.reduce((currentLeft, point) =>
        point.x < currentLeft.x ? point : currentLeft,
      )
      const label = L.SVG.create('text') as SVGTextElement
      label.textContent = this.getLineAxisValue(northing)
      label.setAttribute('x', '6')
      label.setAttribute('y', `${leftPoint.y - northWest.y - 4}`)
      label.setAttribute('class', 'grid-line-ref')
      this.groupElement.appendChild(label)
    }
  }
}

function App() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<BritishGridOverlay | null>(null)
  const osmBaseLayerRef = useRef<L.TileLayer | null>(null)
  const communityTrailsLayerRef = useRef<L.TileLayer | null>(null)
  const officialProwLayerRef = useRef<L.TileLayer.WMS | null>(null)
  const osLayerRef = useRef<L.TileLayer | null>(null)
  const somersetProwLayerRef = useRef<L.GeoJSON | null>(null)
  const pingMarkerRef = useRef<L.Marker | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const overlayStateRef = useRef<OverlayState>({
    spacingMode: 'auto',
    spacing: 1000,
    digits: 8,
  })
  const initialTitle = `Map Grid Printout - ${new Date().toLocaleDateString('en-GB')}`
  const titleBeforeEditRef = useRef(initialTitle)
  const [overlayState, setOverlayState] = useState<OverlayState>({
    spacingMode: 'auto',
    spacing: 1000,
    digits: 8,
  })
  const [activeSpacing, setActiveSpacing] = useState<GridSpacing>(1000)
  const [centerReference, setCenterReference] = useState('Loading grid reference...')
  const [pingLocation, setPingLocation] = useState<L.LatLngLiteral | null>(null)
  const [pingReference, setPingReference] = useState('No ping placed yet. Click the map.')
  const [statusText, setStatusText] = useState('Initialising map...')
  const [printTitle, setPrintTitle] = useState(initialTitle)
  const [communityTrailsEnabled, setCommunityTrailsEnabled] = useState(false)
  const [officialProwEnabled, setOfficialProwEnabled] = useState(false)
  const [storedOsSettings] = useState<Partial<StoredOsSettings>>(() => loadStoredOsSettings())
  const [baseMap, setBaseMap] = useState<'osm' | 'os'>(
    storedOsSettings.baseMap === 'os' ? 'os' : 'osm',
  )
  const [osApiKeysInput, setOsApiKeysInput] = useState(storedOsSettings.osApiKeysInput ?? '')
  const [selectedOsKeyIndex, setSelectedOsKeyIndex] = useState(
    Number.isInteger(storedOsSettings.selectedOsKeyIndex)
      ? Math.max(0, storedOsSettings.selectedOsKeyIndex as number)
      : 0,
  )
  const [osEndpoint, setOsEndpoint] = useState<'zxy' | 'wmts'>(
    storedOsSettings.osEndpoint === 'wmts' ? 'wmts' : 'zxy',
  )
  const [footpathsOpacity, setFootpathsOpacity] = useState(0.82)
  const [officialProwError, setOfficialProwError] = useState(false)
  const [osError, setOsError] = useState(false)
  const [somersetProwEnabled, setSomersetProwEnabled] = useState(false)
  const [somersetProwStatus, setSomersetProwStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [mapKeyOpen, setMapKeyOpen] = useState(true)
  const [osKeyTestRunning, setOsKeyTestRunning] = useState(false)
  const [osKeyTestSummary, setOsKeyTestSummary] = useState('')

  const osApiKeys = useMemo(
    () =>
      osApiKeysInput
        .split(/\r?\n/)
        .map((line, index) => {
          const trimmed = line.trim()
          if (!trimmed) return null

          const separatorIndex = trimmed.indexOf(':')
          if (separatorIndex > 0) {
            const label = trimmed.slice(0, separatorIndex).trim()
            const key = trimmed.slice(separatorIndex + 1).trim()

            if (label && key) {
              return { key, label }
            }
          }

          return { key: trimmed, label: `Key ${index + 1}` }
        })
        .filter((entry): entry is { key: string; label: string } => Boolean(entry)),
    [osApiKeysInput],
  )

  const activeOsApiKeyEntry = osApiKeys[selectedOsKeyIndex] ?? null
  const activeOsApiKey = activeOsApiKeyEntry?.key ?? ''

  const redactOsKey = (key: string) => {
    const trimmed = key.trim()
    if (!trimmed) return '(empty)'
    if (trimmed.length <= 10) return `${trimmed.slice(0, 2)}...${trimmed.slice(-2)}`
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const payload: StoredOsSettings = {
      baseMap,
      osApiKeysInput,
      selectedOsKeyIndex,
      osEndpoint,
    }

    try {
      window.localStorage.setItem(osSettingsStorageKey, JSON.stringify(payload))
    } catch {
      // Ignore storage failures (private mode/quota); app still works without persistence.
    }
  }, [baseMap, osApiKeysInput, selectedOsKeyIndex, osEndpoint])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Community trails layer (Waymarked Trails — OSM-based named routes)
    if (!communityTrailsLayerRef.current) {
      communityTrailsLayerRef.current = L.tileLayer(
        'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
        {
          maxZoom: 18,
          opacity: footpathsOpacity,
          pane: 'overlayPane',
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://waymarkedtrails.org">Waymarked Trails</a>',
        },
      )
    }
    communityTrailsLayerRef.current.setOpacity(footpathsOpacity)
    if (communityTrailsEnabled) {
      if (!map.hasLayer(communityTrailsLayerRef.current)) {
        communityTrailsLayerRef.current.addTo(map)
      }
    } else if (map.hasLayer(communityTrailsLayerRef.current)) {
      map.removeLayer(communityTrailsLayerRef.current)
    }

    // Official PRoW layer (DEFRA / Natural England WMS — England only)
    if (!officialProwLayerRef.current) {
      officialProwLayerRef.current = L.tileLayer.wms(
        'https://environment.data.gov.uk/arcgis/services/Countryside_Access/Public_Rights_of_Way_England/MapServer/WMSServer',
        {
          layers: '0',
          format: 'image/png',
          transparent: true,
          opacity: footpathsOpacity,
          pane: 'overlayPane',
          attribution:
            '&copy; <a href="https://www.gov.uk/government/organisations/natural-england">Natural England</a> / DEFRA',
        },
      )

      officialProwLayerRef.current.on('tileerror', () => {
        setOfficialProwError(true)
      })

      officialProwLayerRef.current.on('tileload', () => {
        setOfficialProwError(false)
      })
    }
    officialProwLayerRef.current.setOpacity(footpathsOpacity)
    if (officialProwEnabled) {
      if (!map.hasLayer(officialProwLayerRef.current)) {
        officialProwLayerRef.current.addTo(map)
      }
    } else if (map.hasLayer(officialProwLayerRef.current)) {
      map.removeLayer(officialProwLayerRef.current)
    }
  }, [communityTrailsEnabled, officialProwEnabled, footpathsOpacity])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !osmBaseLayerRef.current) return

    if (baseMap === 'os' && activeOsApiKey.trim()) {
      // Rebuild OS layer when key changes to ensure stale URL/query params are dropped.
      if (osLayerRef.current) {
        if (map.hasLayer(osLayerRef.current)) map.removeLayer(osLayerRef.current)
        osLayerRef.current = null
      }

      const encodedKey = encodeURIComponent(activeOsApiKey.trim())
      const url =
        osEndpoint === 'zxy'
          ? `https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=${encodedKey}`
          : `https://api.os.uk/maps/raster/v1/wmts?key=${encodedKey}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Outdoor_3857&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png`

      console.info('[OS Maps] Creating base layer', {
        endpoint: osEndpoint.toUpperCase(),
        activeKeyLabel: activeOsApiKeyEntry?.label ?? `Key ${selectedOsKeyIndex + 1}`,
        keyPreview: redactOsKey(activeOsApiKey),
      })

      osLayerRef.current = L.tileLayer(
        url,
        {
          maxZoom: 20,
          attribution:
            'Contains OS data &copy; <a href="https://www.ordnancesurvey.co.uk">Ordnance Survey</a>',
        },
      )

      let firstTileLoadedLogged = false
      osLayerRef.current.on('tileerror', (event: unknown) => {
        setOsError(true)
        console.error('[OS Maps] Tile error', {
          endpoint: osEndpoint.toUpperCase(),
          activeKeyLabel: activeOsApiKeyEntry?.label ?? `Key ${selectedOsKeyIndex + 1}`,
          keyPreview: redactOsKey(activeOsApiKey),
          event,
        })
      })
      osLayerRef.current.on('tileload', () => {
        setOsError(false)
        if (!firstTileLoadedLogged) {
          firstTileLoadedLogged = true
          console.info('[OS Maps] First tile loaded successfully', {
            endpoint: osEndpoint.toUpperCase(),
            activeKeyLabel: activeOsApiKeyEntry?.label ?? `Key ${selectedOsKeyIndex + 1}`,
          })
        }
      })

      if (map.hasLayer(osmBaseLayerRef.current)) {
        map.removeLayer(osmBaseLayerRef.current)
      }

      osLayerRef.current.addTo(map)
      return
    }

    if (osLayerRef.current && map.hasLayer(osLayerRef.current)) {
      map.removeLayer(osLayerRef.current)
    }

    if (!map.hasLayer(osmBaseLayerRef.current)) {
      osmBaseLayerRef.current.addTo(map)
    }
  }, [baseMap, activeOsApiKey, osEndpoint])

  useEffect(() => {
    if (selectedOsKeyIndex >= osApiKeys.length) {
      setSelectedOsKeyIndex(osApiKeys.length > 0 ? osApiKeys.length - 1 : 0)
    }

    if (baseMap === 'os' && osApiKeys.length === 0) {
      setBaseMap('osm')
    }
  }, [selectedOsKeyIndex, osApiKeys.length, baseMap])

  useEffect(() => {
    setOsKeyTestSummary('')
  }, [activeOsApiKey, osEndpoint])

  const buildOsTileProbeUrl = (endpoint: 'zxy' | 'wmts', key: string) => {
    const encodedKey = encodeURIComponent(key)
    const z = 10
    const x = 512
    const y = 340

    if (endpoint === 'zxy') {
      return `https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/${z}/${x}/${y}.png?key=${encodedKey}`
    }

    return `https://api.os.uk/maps/raster/v1/wmts?key=${encodedKey}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Outdoor_3857&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=image/png`
  }

  const testSelectedOsKey = async () => {
    const key = activeOsApiKey.trim()
    if (!key || osKeyTestRunning) {
      return
    }

    setOsKeyTestRunning(true)
    setOsKeyTestSummary('Testing selected key against ZXY and WMTS...')

    console.info('[OS Maps] Starting key probe', {
      activeKeyLabel: activeOsApiKeyEntry?.label ?? `Key ${selectedOsKeyIndex + 1}`,
      keyPreview: redactOsKey(key),
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    })

    const testEndpoint = async (endpoint: 'zxy' | 'wmts') => {
      const url = buildOsTileProbeUrl(endpoint, key)
      const safeUrl = url.replace(/key=[^&]+/, `key=${encodeURIComponent(redactOsKey(key))}`)

      console.info('[OS Maps] Probing endpoint', {
        endpoint: endpoint.toUpperCase(),
        url: safeUrl,
      })

      try {
        const response = await fetch(url, { method: 'GET' })
        console.info('[OS Maps] Probe response', {
          endpoint: endpoint.toUpperCase(),
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          type: response.type,
          redirected: response.redirected,
        })
        return {
          endpoint,
          ok: response.ok,
          detail: response.ok ? 'OK' : `HTTP ${response.status}`,
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Network/CORS error'
        console.error('[OS Maps] Probe failed', {
          endpoint: endpoint.toUpperCase(),
          error,
          message,
        })
        return {
          endpoint,
          ok: false,
          detail: message,
        }
      }
    }

    const [zxyResult, wmtsResult] = await Promise.all([
      testEndpoint('zxy'),
      testEndpoint('wmts'),
    ])

    const summary = `ZXY: ${zxyResult.detail} | WMTS: ${wmtsResult.detail}`
    console.info('[OS Maps] Probe summary', {
      summary,
      zxy: zxyResult,
      wmts: wmtsResult,
    })
    setOsKeyTestSummary(summary)
    setOsKeyTestRunning(false)
  }

  const prowColour = (status: string | null) => {
    switch ((status ?? '').toLowerCase()) {
      case 'footpath': return '#1b7c3c'
      case 'bridleway': return '#c96a00'
      case 'restricted byway': return '#7b3fa0'
      case 'byway open to all traffic': return '#b71c1c'
      default: return '#555555'
    }
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!somersetProwEnabled) {
      if (somersetProwLayerRef.current && map.hasLayer(somersetProwLayerRef.current)) {
        map.removeLayer(somersetProwLayerRef.current)
        console.info('[Somerset PRoW] Layer removed from map.')
      }
      return
    }

    // Already loaded — just re-add and re-apply opacity
    if (somersetProwLayerRef.current) {
      if (!map.hasLayer(somersetProwLayerRef.current)) {
        somersetProwLayerRef.current.addTo(map)
        console.info('[Somerset PRoW] Reusing cached layer and adding to map.')
      }
      somersetProwLayerRef.current.setStyle({ opacity: footpathsOpacity })
      return
    }

    console.info('[Somerset PRoW] Loading /somerset-prow.geojson ...')
    setSomersetProwStatus('loading')
    fetch('/somerset-prow.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!mapRef.current) return
        const featureCount = Array.isArray(data?.features) ? data.features.length : 0
        somersetProwLayerRef.current = L.geoJSON(data, {
          style: (feature) => ({
            color: prowColour(feature?.properties?.status ?? null),
            weight: 2,
            opacity: footpathsOpacity,
          }),
          pane: 'overlayPane',
        })
        somersetProwLayerRef.current.addTo(mapRef.current)
        setSomersetProwStatus('ready')
        console.info(`[Somerset PRoW] Loaded ${featureCount} features.`)
      })
      .catch((error: unknown) => {
        setSomersetProwStatus('error')
        console.error('[Somerset PRoW] Failed to load GeoJSON.', error)
      })
  // prowColour is stable (defined outside effect deps), footpathsOpacity triggers style refresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [somersetProwEnabled, footpathsOpacity])

  useEffect(() => {
    overlayStateRef.current = overlayState

    const zoom = mapRef.current?.getZoom() ?? 13
    const spacing =
      overlayState.spacingMode === 'auto'
        ? getGridSpacingForZoom(zoom)
        : overlayState.spacing

    setActiveSpacing(spacing)
    overlayRef.current?.setSpacing(spacing)

    if (mapRef.current) {
      const center = mapRef.current.getCenter()
      setCenterReference(britishGridRef(latLngToBritishGrid(center), overlayState.digits))

      if (pingLocation) {
        setPingReference(
          britishGridRef(latLngToBritishGrid(pingLocation), overlayState.digits),
        )
      }
    }
  }, [overlayState, pingLocation])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomSnap: 0.25,
      zoomDelta: 0.25,
      wheelPxPerZoomLevel: 180,
      zoomControl: false,
    })

    mapRef.current = map

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    osmBaseLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
    osmBaseLayerRef.current.addTo(map)

    const overlay = new BritishGridOverlay()
    const initialSpacing =
      overlayStateRef.current.spacingMode === 'auto'
        ? getGridSpacingForZoom(map.getZoom())
        : overlayStateRef.current.spacing
    overlay.setSpacing(initialSpacing)
    setActiveSpacing(initialSpacing)
    overlay.addTo(map)
    overlayRef.current = overlay

    const pingIcon = L.divIcon({
      className: 'map-ping-icon',
      html: '<span></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })

    const placePing = (latLng: L.LatLng) => {
      const gridReference = britishGridRef(
        latLngToBritishGrid(latLng),
        overlayStateRef.current.digits,
      )

      if (!pingMarkerRef.current) {
        pingMarkerRef.current = L.marker(latLng, { icon: pingIcon }).addTo(map)
      } else {
        pingMarkerRef.current.setLatLng(latLng)
      }

      pingMarkerRef.current
        .bindPopup(`<strong>Ping</strong><br />${gridReference}`)
        .openPopup()

      setPingLocation({ lat: latLng.lat, lng: latLng.lng })
      setPingReference(gridReference)
    }

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      placePing(event.latlng)
    }

    const updateReference = () => {
      const center = map.getCenter()
      const nextSpacing =
        overlayStateRef.current.spacingMode === 'auto'
          ? getGridSpacingForZoom(map.getZoom())
          : overlayStateRef.current.spacing

      overlayRef.current?.setSpacing(nextSpacing)
      setActiveSpacing((current) => (current === nextSpacing ? current : nextSpacing))

      setCenterReference(
        britishGridRef(latLngToBritishGrid(center), overlayStateRef.current.digits),
      )
      setStatusText(
        `Centre: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)} | Zoom ${map.getZoom()}`,
      )
    }

    map.on('click', handleMapClick)
    map.on('moveend zoomend', updateReference)
    updateReference()

    return () => {
      map.off('click', handleMapClick)
      map.off('moveend zoomend', updateReference)
      pingMarkerRef.current?.remove()
      pingMarkerRef.current = null
      communityTrailsLayerRef.current?.remove()
      communityTrailsLayerRef.current = null
      officialProwLayerRef.current?.remove()
      officialProwLayerRef.current = null
      osmBaseLayerRef.current?.remove()
      osmBaseLayerRef.current = null
      osLayerRef.current?.remove()
      osLayerRef.current = null
      somersetProwLayerRef.current?.remove()
      somersetProwLayerRef.current = null
      overlay.remove()
      overlayRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  const focusLocation = (coordinates: L.LatLngExpression) => {
    mapRef.current?.setView(coordinates, 15)
  }

  const clearPing = () => {
    pingMarkerRef.current?.remove()
    pingMarkerRef.current = null
    setPingLocation(null)
    setPingReference('No ping placed yet. Click the map.')
  }

  const saveEditableTitle = () => {
    if (!titleRef.current) {
      return
    }

    const cleanedTitle = (titleRef.current.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanedTitle) {
      titleRef.current.textContent = printTitle
      return
    }

    const limitedTitle = cleanedTitle.slice(0, 90)
    titleRef.current.textContent = limitedTitle
    setPrintTitle(limitedTitle)
  }

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLHeadingElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.currentTarget.textContent = titleBeforeEditRef.current
      event.currentTarget.blur()
    }
  }

  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== printTitle) {
      titleRef.current.textContent = printTitle
    }
  }, [printTitle])

  return (
    <div className="shell">
      <aside className="panel no-print">
        <p className="eyebrow">Cubs Map Printer</p>
        <h1>OpenStreetMap with a UK grid overlay for printable route cards.</h1>
        <p className="lede">
          Pan to the area you need, use auto-scaling grid spacing as you zoom, and use
          your browser print dialog to produce an A4 handout with National Grid
          references visible.
        </p>

        <button type="button" className="print-button" onClick={() => window.print()}>
          Print this map section
        </button>

        <div className="card">
          <label>
            <span>Grid spacing mode</span>
            <select
              value={overlayState.spacingMode}
              onChange={(event) =>
                setOverlayState((current) => ({
                  ...current,
                  spacingMode: event.target.value as OverlayState['spacingMode'],
                }))
              }
            >
              <option value="auto">Auto (changes with zoom)</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label>
            <span>Manual grid spacing</span>
            <select
              value={overlayState.spacing}
              disabled={overlayState.spacingMode === 'auto'}
              onChange={(event) =>
                setOverlayState((current) => ({
                  ...current,
                  spacing: Number(event.target.value) as GridSpacing,
                }))
              }
            >
              <option value={500}>500 m</option>
              <option value={1000}>1 km</option>
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
            </select>
          </label>

          <p className="status">Active grid spacing: {(activeSpacing / 1000).toFixed(activeSpacing < 1000 ? 1 : 0)} km</p>

          <label>
            <span>Centre reference precision</span>
            <select
              value={overlayState.digits}
              onChange={(event) =>
                setOverlayState((current) => ({
                  ...current,
                  digits: Number(event.target.value) as GridDigits,
                }))
              }
            >
              <option value={4}>4 digits</option>
              <option value={6}>6 digits</option>
              <option value={8}>8 digits</option>
              <option value={10}>10 digits</option>
            </select>
          </label>
        </div>

        <div className="card card--emphasis">
          <p className="meta-label">Map centre grid reference</p>
          <p className="grid-ref">{centerReference}</p>
          <p className="status">{statusText}</p>
        </div>

        <div className="card">
          <p className="meta-label">Dropped ping</p>
          <p className="grid-ref grid-ref--compact">{pingReference}</p>
          <p className="status">
            {pingLocation
              ? `${pingLocation.lat.toFixed(5)}, ${pingLocation.lng.toFixed(5)}`
              : 'Click anywhere on the map to place a ping.'}
          </p>
          <button
            type="button"
            className="chip chip--secondary"
            onClick={clearPing}
            disabled={!pingLocation}
          >
            Clear ping
          </button>
        </div>

        <div className="card">
          <p className="meta-label">Trail overlays</p>

          <label className="toggle-row" htmlFor="somerset-prow-toggle">
            <span>
              Somerset definitive PRoW
              <em className="layer-source">Somerset Council · March 2026 · OGL</em>
            </span>
            <input
              id="somerset-prow-toggle"
              type="checkbox"
              checked={somersetProwEnabled}
              onChange={(event) => setSomersetProwEnabled(event.target.checked)}
            />
          </label>

          {somersetProwEnabled && somersetProwStatus !== 'idle' && (
            <p className="status">
              {somersetProwStatus === 'loading' && 'Loading Somerset PRoW data…'}
              {somersetProwStatus === 'ready' && '16,658 paths loaded.'}
              {somersetProwStatus === 'error' && (
                <span className="status--warning">Failed to load Somerset PRoW data.</span>
              )}
            </p>
          )}

          {somersetProwEnabled && somersetProwStatus === 'ready' && (
            <ul className="prow-legend">
              <li><span className="prow-swatch" style={{ background: '#1b7c3c' }} />Footpath</li>
              <li><span className="prow-swatch" style={{ background: '#c96a00' }} />Bridleway</li>
              <li><span className="prow-swatch" style={{ background: '#7b3fa0' }} />Restricted byway</li>
              <li><span className="prow-swatch" style={{ background: '#b71c1c' }} />Byway (all traffic)</li>
            </ul>
          )}

          <label className="toggle-row" htmlFor="community-trails-toggle">
            <span>
              Community trails
              <em className="layer-source">Waymarked Trails · OSM</em>
            </span>
            <input
              id="community-trails-toggle"
              type="checkbox"
              checked={communityTrailsEnabled}
              onChange={(event) => setCommunityTrailsEnabled(event.target.checked)}
            />
          </label>

          <label className="toggle-row" htmlFor="official-prow-toggle">
            <span>
              Official rights of way
              <em className="layer-source">DEFRA / Natural England · England only</em>
            </span>
            <input
              id="official-prow-toggle"
              type="checkbox"
              checked={officialProwEnabled}
              onChange={(event) => setOfficialProwEnabled(event.target.checked)}
            />
          </label>

          <label className="toggle-row" htmlFor="os-maps-toggle">
            <span>
              Basemap
              <em className="layer-source">Choose OpenStreetMap or OS Outdoor</em>
            </span>
            <select
              id="os-maps-toggle"
              value={baseMap}
              onChange={(event) => {
                const nextBaseMap = event.target.value as 'osm' | 'os'
                if (nextBaseMap === 'os' && !activeOsApiKey.trim()) {
                  setOsError(false)
                  return
                }
                setBaseMap(nextBaseMap)
                setOsError(false)
              }}
            >
              <option value="osm">OpenStreetMap</option>
              <option value="os" disabled={!activeOsApiKey.trim()}>OS Outdoor</option>
            </select>
          </label>

          <label>
            <span>OS Data Hub API keys (one per line)</span>
            <textarea
              placeholder="Examples:&#10;Dev key: abc123...&#10;Prod key: xyz789...&#10;or just paste raw keys one per line"
              value={osApiKeysInput}
              autoComplete="off"
              rows={3}
              onChange={(event) => {
                setOsApiKeysInput(event.target.value)
                setOsError(false)
              }}
            />
          </label>

          {osApiKeys.length > 1 && (
            <label>
              <span>Active OS key</span>
              <select
                value={String(selectedOsKeyIndex)}
                onChange={(event) => {
                  setSelectedOsKeyIndex(Number(event.target.value))
                  setOsError(false)
                }}
              >
                {osApiKeys.map((key, index) => (
                  <option key={index} value={String(index)}>
                    {key.label} ({key.key.slice(0, 6)}...{key.key.slice(-4)})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span>OS endpoint</span>
            <select
              value={osEndpoint}
              onChange={(event) => {
                setOsEndpoint(event.target.value as 'zxy' | 'wmts')
                setOsError(false)
              }}
            >
              <option value="zxy">ZXY</option>
              <option value="wmts">WMTS</option>
            </select>
          </label>

          <button
            type="button"
            className="chip chip--secondary"
            disabled={!activeOsApiKey.trim() || osKeyTestRunning}
            onClick={() => {
              void testSelectedOsKey()
            }}
          >
            {osKeyTestRunning ? 'Testing key...' : 'Test selected key (ZXY + WMTS)'}
          </button>

          {activeOsApiKey && (
            <p className="status">
              Using {activeOsApiKeyEntry?.label ?? `key ${selectedOsKeyIndex + 1}`} with {osEndpoint.toUpperCase()} endpoint.
            </p>
          )}

          {osKeyTestSummary && <p className="status">{osKeyTestSummary}</p>}

          {!activeOsApiKey.trim() && (
            <p className="status">
              Add at least one key from{' '}
              <a
                href="https://osdatahub.os.uk/"
                target="_blank"
                rel="noreferrer"
              >
                osdatahub.os.uk
              </a>
              {' '}→ API Dashboard.
            </p>
          )}

          <label>
            <span>Highlight strength</span>
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={Math.round(footpathsOpacity * 100)}
              disabled={!communityTrailsEnabled && !officialProwEnabled && !somersetProwEnabled}
              onChange={(event) =>
                setFootpathsOpacity(Number(event.target.value) / 100)
              }
            />
          </label>

          <p className="status">
            {!communityTrailsEnabled && !officialProwEnabled && !somersetProwEnabled
              ? 'All layers off.'
              : [
                  somersetProwEnabled && 'Somerset PRoW',
                  communityTrailsEnabled && 'community trails',
                  officialProwEnabled && 'official PRoW',
                ]
                  .filter(Boolean)
                  .join(' + ')
                  .replace(/^./, (c) => c.toUpperCase()) +
                  ` on (${Math.round(footpathsOpacity * 100)}% opacity).`}
          </p>

          {officialProwEnabled && officialProwError && (
            <p className="status status--warning">
              Official PRoW source is currently unavailable (upstream server error).
              Try again later, or use Community trails for now.
            </p>
          )}

          {baseMap === 'os' && osError && (
            <p className="status status--warning">
              OS Maps returned an error for {osEndpoint.toUpperCase()} — check key
              restrictions (referrer/origin), confirm OS Maps API is enabled for this key,
              and try ZXY first to validate the key.
            </p>
          )}
        </div>

        <div className="card">
          <p className="meta-label">Quick jump</p>
          <div className="chips">
            {ukMapLocations.map((location) => (
              <button
                key={location.name}
                type="button"
                className="chip"
                onClick={() => focusLocation(location.coordinates)}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card notes">
          <p className="meta-label">Somerset data</p>
          <p className="status">
            Somerset Council publishes a definitive Rights of Way GIS bundle
            (shapefile / GeoJSON) under the Open Government Licence, updated
            March 2026.
          </p>
          <a
            href="https://somersetcc.sharepoint.com/:u:/s/SCCPublic/EcSDZsLMPVBDgcszPfyjwUQBATozyF8hWIFkdU8fbQC7nA?e=QvJG7R"
            target="_blank"
            rel="noreferrer"
            className="chip chip--secondary"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Download Somerset GIS bundle ↗
          </a>
        </div>

        <div className="card notes">
          <p className="meta-label">Printing tips</p>
          <ul>
            <li>Use landscape orientation for wider route sections.</li>
            <li>Turn on background graphics in the print dialog for better tile colour.</li>
            <li>Enable footpaths to highlight tracked trail routes before printing.</li>
            <li>The overlay uses British National Grid coordinates in EPSG:27700.</li>
          </ul>
        </div>

        <div className="build-meta">
          <p className="meta-label">Build</p>
          <p className="status">Version {buildVersion} · {buildCommit}</p>
          <p className="status">{buildMessage}</p>
          <p className="status">Built {new Date(buildTime).toLocaleString('en-GB')}</p>
        </div>

      </aside>

      <main className="map-stage">
        <header className="map-header">
          <div>
            <h2
              ref={titleRef}
              className="print-title"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Editable map title"
              spellCheck={false}
              title="Click to edit map title"
              onFocus={() => {
                titleBeforeEditRef.current = printTitle
              }}
              onBlur={saveEditableTitle}
              onKeyDown={handleTitleKeyDown}
            >
              {printTitle}
            </h2>
          </div>
          <p className="map-caption">
            Tiles from {baseMap === 'os' ? 'Ordnance Survey' : 'OpenStreetMap'}, overlaid with the UK National Grid.
          </p>
        </header>

        <section className="map-frame">
          <div ref={mapContainerRef} className="map" aria-label="Printable map area" />

          {/* Collapsible map key — only shown when at least one overlay is active */}
          {(communityTrailsEnabled || officialProwEnabled || (somersetProwEnabled && somersetProwStatus === 'ready')) && (
            <div className={`map-key${mapKeyOpen ? ' map-key--open' : ''}`}>
              <button
                className="map-key__toggle"
                onClick={() => setMapKeyOpen(o => !o)}
                aria-expanded={mapKeyOpen}
                aria-label={mapKeyOpen ? 'Collapse map key' : 'Expand map key'}
              >
                Key {mapKeyOpen ? '▾' : '▸'}
              </button>

              {mapKeyOpen && (
                <ul className="map-key__list">
                  {communityTrailsEnabled && (
                    <li>
                      <span className="map-key__swatch" style={{ background: 'rgba(255,140,0,0.85)' }} />
                      Community trails
                    </li>
                  )}
                  {officialProwEnabled && (
                    <li>
                      <span className="map-key__swatch" style={{ background: 'rgba(0,128,64,0.85)' }} />
                      Official footpaths (OS)
                    </li>
                  )}
                  {somersetProwEnabled && somersetProwStatus === 'ready' && (
                    <>
                      <li><span className="map-key__swatch" style={{ background: '#1b7c3c' }} />Somerset footpath</li>
                      <li><span className="map-key__swatch" style={{ background: '#c96a00' }} />Somerset bridleway</li>
                      <li><span className="map-key__swatch" style={{ background: '#7b3fa0' }} />Restricted byway</li>
                      <li><span className="map-key__swatch" style={{ background: '#b71c1c' }} />Byway (all traffic)</li>
                    </>
                  )}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
