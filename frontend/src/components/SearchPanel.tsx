import styles from './SearchPanel.module.css'
import type { Place, SearchResponse } from '../types'
import { searchPlaces } from '../services/api'
import { useState } from 'react'
import { ResultsList } from './ResultsList'

type Props = {
  onResult: (res: SearchResponse) => void
  onPlaceSelect?: (place: Place) => void
}

export function SearchPanel({ onResult, onPlaceSelect }: Props) {
  const [prompt, setPrompt] = useState('find coffee shops open now in Bandung within 3 km, starting from Alun Alun Bandung')
  const [loading, setLoading] = useState(false)
  const [lastResults, setLastResults] = useState<Place[]>([])

  const openInMaps = (p: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + (p.address || ''))}`
    window.open(url, '_blank')
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await searchPlaces(prompt)
      setLastResults(res.results)
      onResult(res)
    } catch (error) {
      console.error('Search error:', error)
      // TODO: Add error toast notification
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      submit()
    }
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>
           AI Maps Assistant</div>
        <div className={styles.subtitle}>
          Search for places using natural language. Results will appear on the map and in the list below.
        </div>
      </div>

      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Find sushi restaurants open now in South Jakarta within 2 km..."
        />
        <button className={styles.button} onClick={submit} disabled={loading}>
          {loading && <span className={styles.loadingSpinner} />}
          {loading ? 'Searching...' : 'Search (⌘+Enter)'}
        </button>
      </div>

      {lastResults.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitle}>Results</div>
            <div className={styles.resultsBadge}>{lastResults.length}</div>
          </div>
          <div className={styles.list}>
            <ResultsList
              places={lastResults}
              onOpenMaps={openInMaps}
              onPlaceClick={onPlaceSelect}
            />
          </div>
        </div>
      )}
    </aside>
  )
}


