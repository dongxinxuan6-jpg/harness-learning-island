import { ChevronDown } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'

interface ExpandableLayerProps {
  label: string
  collapseLabel: string
  icon: ReactNode
  children: ReactNode
}

export function ExpandableLayer({ label, collapseLabel, icon, children }: ExpandableLayerProps) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()

  return (
    <div className="expandable-layer">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>{icon}{expanded ? collapseLabel : label}</span>
        <ChevronDown className={expanded ? 'is-open' : ''} aria-hidden="true" size={17} />
      </button>
      {expanded ? <div className="expandable-layer__content" id={contentId}>{children}</div> : null}
    </div>
  )
}
