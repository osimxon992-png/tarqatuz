import { useEffect, useState } from 'react'

// shortcut: tiny History-API router for a handful of static pages; move to react-router if pages get params or nesting.
// Hosting must serve index.html for unknown paths (SPA fallback), or direct links like /kanallar will 404.

const onRoute = new EventTarget()

export function navigate(to) {
  if (to === location.pathname) return window.scrollTo(0, 0) // e.g. logo click on the home page
  history.pushState(null, '', to)
  onRoute.dispatchEvent(new Event('change'))
}

export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const update = () => {
      window.scrollTo(0, 0) // every page opens at its top, also on back/forward
      setPath(location.pathname)
    }
    onRoute.addEventListener('change', update)
    addEventListener('popstate', update)
    return () => {
      onRoute.removeEventListener('change', update)
      removeEventListener('popstate', update)
    }
  }, [])
  return path
}

export function Link({ to, onClick, ...props }) {
  return (
    <a
      href={to}
      {...props}
      onClick={(e) => {
        onClick?.(e)
        // Let the browser handle new-tab / modified clicks
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(to)
      }}
    />
  )
}
