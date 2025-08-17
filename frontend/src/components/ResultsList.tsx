import styles from './ResultsList.module.css'
import type { Place } from '../types'

type Props = {
  places: Place[]
  onOpenMaps: (p: Place) => void
  onPlaceClick?: (p: Place) => void
}

export function ResultsList({ places, onOpenMaps, onPlaceClick }: Props) {
  const renderStars = (rating?: number) => {
    if (!rating) return null
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))
    return <span className={styles.stars}>{stars}</span>
  }

  const getOpenStatus = (openNow?: boolean) => {
    if (openNow === undefined) return null
    return (
      <span className={`${styles.openBadge} ${openNow ? styles.openNow : styles.closed}`}>
        {openNow ? 'Open' : 'Closed'}
      </span>
    )
  }

    return (
    <div className={styles.container}>
      {places.map((p, i) => (
        <div
          className={styles.item}
          key={i}
          onClick={() => onPlaceClick?.(p)}
        >
          <div className={styles.content}>
            <div className={styles.title}>{p.name}</div>
            <div className={styles.meta}>{p.address}</div>

            {p.rating && (
              <div className={styles.rating}>
                {renderStars(p.rating)}
                <span className={styles.ratingText}>{p.rating}</span>
              </div>
            )}

            {getOpenStatus(p.open_now)}
          </div>

          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.linkButton}
              onClick={() => onOpenMaps(p)}
              title="Buka di Google Maps"
            >
              📍 Open
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


