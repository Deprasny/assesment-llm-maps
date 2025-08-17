import { useEffect, useState } from 'react'
import styles from './MapView.module.css'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import type { Place } from '../types'

type Props = {
  places: Place[]
  polyline?: string
  onMapReady?: (mapActions: { focusOnLocation: (lat: number, lng: number) => void; clearDirections: () => void }) => void
}

export function MapView({ places, polyline, onMapReady }: Props) {
  const { loaded, mountMap, setMarkers, setMarkersWithInfo, focusOnLocation, clearDirections } = useGoogleMaps()
  const [showInfo, setShowInfo] = useState(true)

  useEffect(() => {
    if (!loaded) return
    setMarkersWithInfo(places.map(p => ({ lat: p.lat, lng: p.lng, name: p.name, address: p.address, rating: p.rating, place_id: p.place_id, open_now: p.open_now })))
  }, [loaded, places])

  // Directions feature disabled: clear any incoming polyline and only keep markers
  useEffect(() => {
    // no-op: we do not draw polylines anymore
  }, [loaded, polyline])

  // Notify parent when map is ready with actions
  useEffect(() => {
    if (loaded && onMapReady) {
      onMapReady({ focusOnLocation, clearDirections })
    }
  }, [loaded, onMapReady, focusOnLocation, clearDirections])

  const centerMap = () => {
    if (places.length > 0) {
      setMarkers(places.map(p => ({ lat: p.lat, lng: p.lng, title: p.name })))
    }
  }

  return (
    <div className={styles.container}>
      {!loaded && (
        <div className={styles.mapLoading}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <div>Loading map...</div>
          </div>
        </div>
      )}

      <div ref={mountMap as any} style={{ width: '100%', height: '100%' }} />

      {loaded && (
        <div className={styles.mapControls}>
          <button
            className={styles.controlButton}
            onClick={centerMap}
            title="Center to results"
          >
            🎯
          </button>
          <button
            className={styles.controlButton}
            onClick={() => setShowInfo(!showInfo)}
            title="Toggle info panel"
          >
            ℹ️
          </button>
        </div>
      )}

      {loaded && showInfo && places.length > 0 && (
        <div className={styles.mapInfo}>
          <div className={styles.mapInfoContent}>
            <div className={styles.mapInfoIcon}>📍</div>
            <div className={styles.mapInfoText}>
              <div className={styles.mapInfoTitle}>
                {places.length} places found
              </div>
              <div className={styles.mapInfoSubtitle}>
                Click a marker to view details, or pick an item on the left panel
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


