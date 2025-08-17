import { useEffect, useRef, useState } from 'react'

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_BROWSER_KEY as string

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const map = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.Marker[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsService = useRef<google.maps.DirectionsService | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  useEffect(() => {
    if ((window as any).google?.maps) {
      setLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => setLoaded(true)
    document.body.appendChild(script)
  }, [])

  const mountMap = (el: HTMLDivElement | null) => {
    mapRef.current = el
    if (el && loaded && !map.current) {
      map.current = new google.maps.Map(el, {
        center: { lat: -6.9175, lng: 107.6191 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    }
  }

  // Ensure map initializes after script loads even if mount happened earlier
  useEffect(() => {
    if (loaded && mapRef.current && !map.current) {
      map.current = new google.maps.Map(mapRef.current, {
        center: { lat: -6.9175, lng: 107.6191 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    }
  }, [loaded])

  const setMarkers = (points: { lat: number; lng: number; title?: string }[]) => {
    if (!map.current) return
    markers.current.forEach(m => m.setMap(null))
    markers.current = []
    const bounds = new google.maps.LatLngBounds()
    points.forEach(p => {
      const m = new google.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map: map.current!, title: p.title })
      markers.current.push(m)
      bounds.extend(m.getPosition()!)
    })
    if (!bounds.isEmpty()) map.current.fitBounds(bounds)
  }

  /**
   * Create markers with InfoWindow content. Expected fields: lat, lng, name, address, rating, place_id, open_now
   */
  const setMarkersWithInfo = (
    items: Array<{ lat: number; lng: number; name?: string; address?: string; rating?: number; place_id?: string; open_now?: boolean }>,
  ) => {
    if (!map.current) return
    if (!infoWindowRef.current) infoWindowRef.current = new google.maps.InfoWindow()

    markers.current.forEach(m => m.setMap(null))
    markers.current = []
    const bounds = new google.maps.LatLngBounds()

    items.forEach(item => {
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        title: item.name,
        map: map.current!,
      })

      marker.addListener('click', () => {
        const gmUrl = item.place_id
          ? `https://www.google.com/maps/place/?q=place_id:${item.place_id}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name || ''} ${item.address || ''}`)}`

        const content = `
          <div style="max-width:260px;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial;">
            <div style="font-weight:600;margin-bottom:4px;">${item.name || 'Unknown place'}</div>
            ${item.address ? `<div style="color:#6b7280;font-size:12px;line-height:1.4;margin-bottom:6px;">${item.address}</div>` : ''}
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
              ${item.rating ? `<span style="color:#f59e0b;">★ ${item.rating.toFixed(1)}</span>` : ''}
              ${typeof item.open_now === 'boolean' ? `<span style="font-size:11px;color:${item.open_now ? '#059669' : '#dc2626'};">${item.open_now ? 'Buka' : 'Tutup'}</span>` : ''}
            </div>
            <a href="${gmUrl}" target="_blank" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:6px 10px;border-radius:6px;font-size:12px;">Open in Google Maps</a>
          </div>`

        infoWindowRef.current!.setContent(content)
        infoWindowRef.current!.open({ map: map.current!, anchor: marker })
      })

      markers.current.push(marker)
      bounds.extend(marker.getPosition()!)
    })
    if (!bounds.isEmpty()) map.current.fitBounds(bounds)
  }

  const drawPolyline = (decoded: google.maps.LatLngLiteral[]) => {
    if (!map.current) return
    if (polylineRef.current) polylineRef.current.setMap(null)
    polylineRef.current = new google.maps.Polyline({
      path: decoded,
      geodesic: true,
      strokeColor: '#1A73E8',
      strokeOpacity: 0.9,
      strokeWeight: 4,
    })
    polylineRef.current.setMap(map.current)
  }

  const showRoute = async (origin: string, destination: google.maps.LatLngLiteral) => {
    if (!map.current) return
    if (!directionsService.current) directionsService.current = new google.maps.DirectionsService()
    if (directionsRenderer.current) directionsRenderer.current.setMap(null)
    directionsRenderer.current = new google.maps.DirectionsRenderer({ suppressMarkers: false })
    directionsRenderer.current.setMap(map.current)

    await directionsService.current.route(
      { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.current?.setDirections(result)
        }
      }
    )
  }

  const focusOnLocation = (lat: number, lng: number, zoom = 16) => {
    if (!map.current) return
    map.current.panTo({ lat, lng })
    map.current.setZoom(zoom)

    // Add a subtle bounce animation to the marker
    const targetMarker = markers.current.find(marker => {
      const pos = marker.getPosition()
      return pos && Math.abs(pos.lat() - lat) < 0.0001 && Math.abs(pos.lng() - lng) < 0.0001
    })

    if (targetMarker) {
      targetMarker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => targetMarker.setAnimation(null), 2000)
    }
  }

  const clearDirections = () => {
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null)
      directionsRenderer.current = null
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }
  }

  return { loaded, mountMap, setMarkers, setMarkersWithInfo, drawPolyline, showRoute, focusOnLocation, clearDirections }
}


