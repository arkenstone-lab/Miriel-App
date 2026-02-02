import { useState, useEffect } from 'react'
import { Dimensions, Platform } from 'react-native'

const DESKTOP_BREAKPOINT = 1024

function getWidth() {
  return Dimensions.get('window').width
}

export function useResponsiveLayout() {
  const [width, setWidth] = useState(getWidth)

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWidth(window.width)
    })

    return () => subscription.remove()
  }, [])

  return {
    width,
    isDesktop: width >= DESKTOP_BREAKPOINT,
    isMobile: width < DESKTOP_BREAKPOINT,
  }
}
