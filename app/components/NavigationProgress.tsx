import { Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigation } from 'react-router'

// Waiting this long before showing the bar keeps fast (prefetched)
// navigations from flashing it.
const SHOW_DELAY_MS = 120

type Phase = 'idle' | 'start' | 'run' | 'done'

const widths: Record<Phase, string> = {
  idle: '0%',
  start: '0%',
  run: '85%',
  done: '100%',
}

const transitions: Record<Phase, string> = {
  idle: 'none',
  start: 'none',
  // Fast at first, then slower and slower: it never looks stuck
  run: 'width 8s cubic-bezier(0.1, 0.6, 0.3, 1)',
  done: 'width 0.2s ease-out, opacity 0.3s ease 0.2s',
}

// Thin progress bar at the top while the next page's data is loading
// (search, pagination, any link), plus a progress cursor.
export function NavigationProgress() {
  const busy = useNavigation().state !== 'idle'
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    if (busy) {
      let frame = 0
      const timer = setTimeout(() => {
        setPhase('start')
        frame = requestAnimationFrame(() =>
          requestAnimationFrame(() => setPhase('run')),
        )
      }, SHOW_DELAY_MS)
      return () => {
        clearTimeout(timer)
        cancelAnimationFrame(frame)
      }
    }
    setPhase((p) => (p === 'idle' ? 'idle' : 'done'))
    const timer = setTimeout(() => setPhase('idle'), 500)
    return () => clearTimeout(timer)
  }, [busy])

  useEffect(() => {
    document.documentElement.style.cursor = busy ? 'progress' : ''
  }, [busy])

  if (phase === 'idle') return null

  return (
    <Box
      role='progressbar'
      aria-label='Az oldal betöltése'
      position='fixed'
      top='0'
      left='0'
      zIndex='max'
      h='3px'
      bg='accent.400'
      boxShadow='0 0 6px rgba(244, 169, 28, 0.7)'
      pointerEvents='none'
      style={{
        width: widths[phase],
        opacity: phase === 'done' ? 0 : 1,
        transition: transitions[phase],
      }}
    />
  )
}
