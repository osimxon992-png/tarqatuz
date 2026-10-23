import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const MQ = {
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767.98px)',
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
}
// Pinned / horizontal effects run only here; elsewhere sections stack vertically.
export const FULL_MOTION = `${MQ.desktop} and ${MQ.motion}`

export { gsap, ScrollTrigger, useGSAP }
