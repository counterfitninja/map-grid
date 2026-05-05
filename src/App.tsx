import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
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

const defaultCenter: L.LatLngExpression = [51.229, -2.321]

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
  const communityTrailsLayerRef = useRef<L.TileLayer | null>(null)
  const officialProwLayerRef = useRef<L.TileLayer.WMS | null>(null)
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
  const [footpathsOpacity, setFootpathsOpacity] = useState(0.82)

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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

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

          <label>
            <span>Highlight strength</span>
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={Math.round(footpathsOpacity * 100)}
              disabled={!communityTrailsEnabled && !officialProwEnabled}
              onChange={(event) =>
                setFootpathsOpacity(Number(event.target.value) / 100)
              }
            />
          </label>

          <p className="status">
            {!communityTrailsEnabled && !officialProwEnabled
              ? 'Both layers off.'
              : [
                  communityTrailsEnabled && 'community trails',
                  officialProwEnabled && 'official PRoW',
                ]
                  .filter(Boolean)
                  .join(' + ')
                  .replace(/^./, (c) => c.toUpperCase()) +
                  ` on (${Math.round(footpathsOpacity * 100)}% opacity).`}
          </p>
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
          <p className="meta-label">Printing tips</p>
          <ul>
            <li>Use landscape orientation for wider route sections.</li>
            <li>Turn on background graphics in the print dialog for better tile colour.</li>
            <li>Enable footpaths to highlight tracked trail routes before printing.</li>
            <li>The overlay uses British National Grid coordinates in EPSG:27700.</li>
          </ul>
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
            Tiles from OpenStreetMap, overlaid with the UK National Grid.
          </p>
        </header>

        <section className="map-frame">
          <div ref={mapContainerRef} className="map" aria-label="Printable map area" />
        </section>
      </main>
    </div>
  )
}

export default App
