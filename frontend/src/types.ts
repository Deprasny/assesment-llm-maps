export type Place = {
  name: string
  address?: string
  lat: number
  lng: number
  rating?: number
  place_id?: string
  open_now?: boolean
}

export type Intent = {
  query: string
  location_text?: string
  radius_m: number
  open_now: boolean
  route_from?: string
}

export type Directions = {
  polyline?: string
  distance_text?: string
  duration_text?: string
}

export type SearchResponse = {
  intent: Intent
  results: Place[]
  directions?: Directions | null
}


