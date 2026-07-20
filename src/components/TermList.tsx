import { Star } from 'lucide-react'
import { glossary } from '../content/glossary'

interface TermListProps {
  termKeys: string[]
  favorites?: Set<string>
  onToggleFavorite?: (termKey: string) => void
}

export function TermList({ termKeys, favorites = new Set(), onToggleFavorite }: TermListProps) {
  const terms = termKeys.map((key) => {
    const term = glossary.find((entry) => entry.key === key)
    if (!term) throw new Error(`Unknown glossary term: ${key}`)
    return term
  })

  return (
    <ul className="term-list">
      {terms.map((term) => {
        const favorite = favorites.has(term.key)
        return (
          <li key={term.key}>
            <div>
              <b>{term.english}（{term.chinese}）</b>
              <p>{term.beginner}</p>
            </div>
            {onToggleFavorite ? (
              <button
                className={favorite ? 'is-favorite' : ''}
                type="button"
                onClick={() => onToggleFavorite(term.key)}
                aria-label={`${favorite ? '取消收藏' : '收藏'} ${term.english}（${term.chinese}）`}
                title={favorite ? '取消收藏' : '收藏词卡'}
              >
                <Star aria-hidden="true" size={17} fill={favorite ? 'currentColor' : 'none'} />
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
