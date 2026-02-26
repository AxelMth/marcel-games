"use client"

import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import type { Country, Continent } from "@/lib/countries"
import { Spinner } from "@marcel-games/ui"

interface GeoJsonFeature {
  type: "Feature"
  properties?: Record<string, unknown>
  geometry: unknown
}
interface GeoJsonFeatureCollection {
  type: "FeatureCollection"
  features: GeoJsonFeature[]
}

const WORLD_GEOJSON_URL = "/data/world.geo.json"
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/light-v11"

const COUNTRY_GREEN = "#6d9581"
const COUNTRY_BORDER_WHITE = "#ffffff"
/** Yellow highlight for "Show on Map" hint (matches previous version). */
const COUNTRY_HIGHLIGHT_COLOR = "#FFD700"

/** Centers and zoom levels aligned with earthunt Map.tsx. */
const continentCenters: Record<Continent, { center: [number, number]; zoom: number }> = {
  EUROPE: { center: [30, 60], zoom: 1.8 },
  ASIA: { center: [85, 25], zoom: 1.3 },
  AMERICAS: { center: [-100, 30], zoom: 1 },
  AFRICA: { center: [20, 0], zoom: 1.95 },
  OCEANIA: { center: [148, -35], zoom: 2 },
  ANTARCTICA: { center: [0, -80], zoom: 2 },
}

/** GeoJSON feature properties from world.geo.json (ADM0_A3 = ISO 3166-1 alpha-3). */
interface WorldFeatureProperties {
  ADM0_A3?: string
  CONTINENT?: string
  [key: string]: unknown
}

/** Compute [minLng, minLat, maxLng, maxLat] from a GeoJSON geometry (Point, LineString, Polygon, MultiPolygon). */
function bboxFromGeometry(geometry: GeoJsonFeature["geometry"]): [number, number, number, number] | null {
  const coords: [number, number][] = []
  function collect(coordsOrNested: unknown): void {
    if (Array.isArray(coordsOrNested)) {
      const first = coordsOrNested[0]
      if (typeof first === "number" && typeof coordsOrNested[1] === "number") {
        coords.push([coordsOrNested[0], coordsOrNested[1]])
        return
      }
      coordsOrNested.forEach(collect)
    }
  }
  const g = geometry as { type: string; coordinates?: unknown }
  if (g?.coordinates) collect(g.coordinates)
  if (coords.length === 0) return null
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
}

function filterGeoJsonFeatures(
  collection: GeoJsonFeatureCollection | null,
  continent: Continent | undefined,
  missingCodes: string[],
  foundCodes: string[],
  highlightedCode: string | null
): GeoJsonFeatureCollection {
  if (!collection?.features?.length) {
    return { type: "FeatureCollection", features: [] }
  }
  const continentValue =
    continent === "ANTARCTICA" ? "Antarctica" : continent
  const features = collection.features.filter((f: GeoJsonFeature) => {
    const props = f.properties as WorldFeatureProperties | undefined
    const code = props?.ADM0_A3
    if (!code) return false
    if (continent && props?.CONTINENT !== continentValue) return false
    // Display country if it's not in the missing list, or if it's already found, or if it's the highlighted hint country
    if (missingCodes.length === 0) return true
    const isMissing = missingCodes.includes(code)
    const isFound = foundCodes.includes(code)
    return !isMissing || isFound || code === highlightedCode
  })
  return { type: "FeatureCollection", features }
}

interface WorldMapProps {
  missingCountries: Country[]
  foundCountries: Country[]
  highlightedCountry: string | null
  continent?: Continent
}

export function WorldMap({
  missingCountries,
  foundCountries,
  highlightedCountry,
  continent
}: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const initialized = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [fullGeoJson, setFullGeoJson] = useState<GeoJsonFeatureCollection | null>(null)

  // GeoJSON uses ADM0_A3 (3-letter codes); Country.code is 3-letter
  const foundCodes = useMemo(() => foundCountries.map((c) => c.code), [foundCountries])
  const missingCodes = useMemo(() => missingCountries.map((c) => c.code), [missingCountries])
  const highlightedCode = highlightedCountry ?? null

  const filteredGeoJson = useMemo(
    () =>
      filterGeoJsonFeatures(
        fullGeoJson,
        continent,
        missingCodes,
        foundCodes,
        highlightedCode
      ),
    [fullGeoJson, continent, missingCodes, foundCodes, highlightedCode]
  )

  const updateMapLayers = useCallback(() => {
    const m = map.current
    if (!m || !m.isStyleLoaded()) return
    if (!m.getLayer("country-fills")) return

    // Paint by ADM0_A3 (3-letter): highlight > found > default
    const fillExpression: mapboxgl.ExpressionSpecification = [
      "case",
      ["in", ["get", "ADM0_A3"], ["literal", foundCodes]],
      COUNTRY_GREEN,
      COUNTRY_GREEN,
    ]

    if (m.getLayer("country-fills")) {
      m.setPaintProperty("country-fills", "fill-color", fillExpression)
      m.setPaintProperty("country-fills", "fill-opacity", 1)
    }

    const highlightedFillExpression: mapboxgl.ExpressionSpecification = [
      "case",
      highlightedCode
        ? ["==", ["get", "ADM0_A3"], highlightedCode]
        : ["literal", false],
      COUNTRY_HIGHLIGHT_COLOR,
      COUNTRY_GREEN,
    ]
    if (m.getLayer("country-fills-highlighted")) {
      m.setPaintProperty("country-fills-highlighted", "fill-color", highlightedFillExpression)
      m.setPaintProperty("country-fills-highlighted", "fill-opacity", 1)
    }

    const borderWidthExpression: mapboxgl.ExpressionSpecification = [
      "case",
      highlightedCode
        ? ["==", ["get", "ADM0_A3"], highlightedCode]
        : ["literal", false],
      2.5,
      ["in", ["get", "ADM0_A3"], ["literal", foundCodes]],
      1,
      0.6,
    ]

    const borderOpacityExpression: mapboxgl.Expression = [
      "case",
      highlightedCode
        ? ["==", ["get", "ADM0_A3"], highlightedCode]
        : ["literal", false],
      1,
      ["in", ["get", "ADM0_A3"], ["literal", foundCodes]],
      1,
      0.3,
    ]

    if (m.getLayer("country-borders")) {
      m.setPaintProperty("country-borders", "line-width", borderWidthExpression)
      m.setPaintProperty("country-borders", "line-color", COUNTRY_BORDER_WHITE)
      m.setPaintProperty("country-borders", "line-opacity", borderOpacityExpression)
    }
  }, [foundCodes, highlightedCode])

  // Load world GeoJSON once
  useEffect(() => {
    let cancelled = false
    fetch(WORLD_GEOJSON_URL)
      .then((res) => res.json())
      .then((data: GeoJsonFeatureCollection) => {
        if (!cancelled) setFullGeoJson(data)
      })
      .catch(() => {
        if (!cancelled) setFullGeoJson({ type: "FeatureCollection", features: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || initialized.current) return
    if (!MAPBOX_TOKEN) {
      setMapReady(true)
      return
    }
    setMapReady(false)
    initialized.current = true

    mapboxgl.accessToken = MAPBOX_TOKEN

    const { center, zoom } = continent
      ? continentCenters[continent]
      : { center: [0, 20] as [number, number], zoom: 1 }

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center,
      zoom,
      attributionControl: false,
      logoPosition: "bottom-left",
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
    })

    m.on("style.load", () => {
      const layers = m.getStyle().layers
      if (layers) {
        for (const layer of layers) {
          if (
            layer.type === "symbol" ||
            (layer.id && (layer.id.includes("label") || layer.id.includes("place") || layer.id.includes("poi")))
          ) {
            m.removeLayer(layer.id)
          }
        }
      }

      // GeoJSON source: only displayed countries (missing not-found excluded by filter)
      if (!m.getSource("country-boundaries")) {
        m.addSource("country-boundaries", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        })
      }

      m.addLayer(
        {
          id: "country-fills",
          type: "fill",
          source: "country-boundaries",
          paint: {
            "fill-color": COUNTRY_GREEN,
            "fill-opacity": 1,
          },
        },
        m.getStyle().layers?.find((l) => l.type === "symbol")?.id
      )

      m.addLayer({
        id: "country-fills-highlighted",
        type: "fill",
        source: "country-boundaries",
        paint: {
          "fill-color": COUNTRY_HIGHLIGHT_COLOR,
          "fill-opacity": 1,
        },
      })

      m.addLayer({
        id: "country-fills-found",
        type: "fill",
        source: "country-boundaries",
        paint: {
          "fill-color": COUNTRY_GREEN,
          "fill-opacity": 1,
        },
      })

      m.addLayer({
        id: "country-borders",
        type: "line",
        source: "country-boundaries",
        paint: {
          "line-color": COUNTRY_BORDER_WHITE,
          "line-width": 0.6,
          "line-opacity": 0.3,
        },
      })

      updateMapLayers()
      m.once("idle", () => setMapReady(true))
    })

    map.current = m

    return () => {
      m.remove()
      map.current = null
      initialized.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push filtered GeoJSON into the source when map and data are ready
  useEffect(() => {
    const m = map.current
    if (!m || !mapReady || !m.getSource("country-boundaries")) return
    const source = m.getSource("country-boundaries") as mapboxgl.GeoJSONSource
    if (!source?.setData) return
    source.setData(filteredGeoJson as Parameters<mapboxgl.GeoJSONSource["setData"]>[0])
    updateMapLayers()
  }, [filteredGeoJson, updateMapLayers, mapReady])

  // Update layers when game state changes
  useEffect(() => {
    updateMapLayers()
  }, [updateMapLayers])

  // Fly to highlighted country when "Show on map" hint is used
  useEffect(() => {
    const m = map.current
    if (!highlightedCode || !m || !mapReady || !fullGeoJson?.features?.length) return
    const feature = fullGeoJson.features.find(
      (f) => (f.properties as WorldFeatureProperties)?.ADM0_A3 === highlightedCode
    )
    if (!feature?.geometry) return
    const bbox = bboxFromGeometry(feature.geometry)
    if (!bbox) return
    const [[swLng, swLat], [neLng, neLat]] = [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ]
    m.fitBounds(
      [
        [swLng, swLat],
        [neLng, neLat],
      ],
      { padding: 60, maxZoom: 8, duration: 800 }
    )
  }, [highlightedCode, mapReady, fullGeoJson])

  return (
    <div className="relative size-full">
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />
      {!mapReady && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted/80"
          aria-hidden
        >
          <Spinner className="size-10 text-primary" />
        </div>
      )}
    </div>
  )
}
