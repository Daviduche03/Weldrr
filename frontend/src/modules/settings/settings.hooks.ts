import { useEffect, useRef, useState } from 'react'

export function useFlash(duration = 1600): [boolean, () => void] {
  const [active, setActive] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const fire = () => {
    setActive(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setActive(false), duration)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return [active, fire]
}
