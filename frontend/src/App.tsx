import { useState, useRef } from 'react'
import './App.css'
import { MapView } from './components/MapView'
import { SearchPanel } from './components/SearchPanel'
import type { SearchResponse, Place } from './types'

function App() {
  const [data, setData] = useState<SearchResponse | null>(null)
  const mapActionsRef = useRef<{
    focusOnLocation: (lat: number, lng: number) => void
    clearDirections: () => void
  } | null>(null)

  const handlePlaceSelect = (place: Place) => {
    if (mapActionsRef.current) {
      // Clear any existing directions first
      mapActionsRef.current.clearDirections()

      // Focus on the selected location
      mapActionsRef.current.focusOnLocation(place.lat, place.lng)

      // Directions removed: only focus the camera
    }
  }

  const handleMapReady = (actions: typeof mapActionsRef.current) => {
    mapActionsRef.current = actions
  }

  return (
    <div className="app-layout">
      <SearchPanel
        onResult={setData}
        onPlaceSelect={handlePlaceSelect}
      />
      <MapView
        places={data?.results || []}
        polyline={undefined}
        onMapReady={handleMapReady}
      />
    </div>
  )
}

export default App
