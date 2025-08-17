import axios from 'axios'
import type { SearchResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function searchPlaces(prompt: string) {
  const res = await axios.post<SearchResponse>(`${API_BASE}/api/places/search`, { prompt })
  return res.data
}


