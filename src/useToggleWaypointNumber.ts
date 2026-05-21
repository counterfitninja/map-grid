import { useState } from 'react'

export function useToggleWaypointNumber(_count: number) {
  const [hiddenIndexes, setHiddenIndexes] = useState<Set<number>>(new Set())

  function isHidden(index: number) {
    return hiddenIndexes.has(index)
  }

  function toggle(index: number) {
    setHiddenIndexes(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return { isHidden, toggle, hiddenIndexes }
}
