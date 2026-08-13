import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Read the real value synchronously on first render instead of starting
  // at undefined/false and correcting a tick later in an effect. This app
  // has no SSR step to worry about (window is always available), and the
  // one-tick "false" flash was very real: ContentModal only mounts once a
  // recommendation exists ({moodRecommendation && <ContentModal/>} in
  // Sidebar/MobileSidebar), so every time one arrived, useIsMobile briefly
  // reported false on a fresh mobile device, the modal rendered as a
  // desktop-style overlay Dialog for a frame, then flipped back — visible
  // as the recommendation screen flickering/fighting with the dashboard
  // underneath before settling.
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
