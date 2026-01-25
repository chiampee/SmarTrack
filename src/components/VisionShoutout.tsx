import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'

const STORAGE_KEY_PREFIX = 'smartrack-vision-shoutout-seen'

function storageKey(userId: string | null | undefined): string {
  return `${STORAGE_KEY_PREFIX}-${String(userId ?? 'anon')}`
}

export function getVisionShoutoutSeen(userId?: string | null): boolean {
  try {
    return localStorage.getItem(storageKey(userId)) === 'true'
  } catch {
    return false
  }
}

export function setVisionShoutoutSeen(userId?: string | null): void {
  try {
    localStorage.setItem(storageKey(userId), 'true')
  } catch {
    // ignore
  }
}

export interface VisionShoutoutProps {
  isOpen: boolean
  onEnter: () => void
  /** Called when the overlay has finished exiting. Use to e.g. trigger Add Link shimmer. */
  onEntered?: () => void
  /** User id for per-user localStorage (so multiple accounts on same browser each get the welcome once). */
  userId?: string | null
  /** Whether to enable magnetic hover (desktop only). */
  magneticHover?: boolean
  /** When true, disables breathe animation, magnetic hover, tilt, and button shimmer. */
  prefersReducedMotion?: boolean
}

const TILT_MAX_DEG = 5

export const VisionShoutout: React.FC<VisionShoutoutProps> = ({
  isOpen,
  onEnter,
  onEntered,
  userId,
  magneticHover = true,
  prefersReducedMotion = false,
}) => {
  const [magnet, setMagnet] = useState({ x: 0, y: 0 })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Card tilt: subtle 3D follow from mouse (disabled when reduced motion)
      if (!prefersReducedMotion && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const ry = (rect.width / 2) ? ((e.clientX - cx) / (rect.width / 2)) * TILT_MAX_DEG : 0
        const rx = (rect.height / 2) ? ((e.clientY - cy) / (rect.height / 2)) * -TILT_MAX_DEG : 0
        setTilt({
          x: Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, rx)),
          y: Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, ry)),
        })
      }
      // Magnetic button
      if (magneticHover && !prefersReducedMotion && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) * 0.08
        const dy = (e.clientY - cy) * 0.08
        const limit = 10
        setMagnet({
          x: Math.max(-limit, Math.min(limit, dx)),
          y: Math.max(-limit, Math.min(limit, dy)),
        })
      }
    },
    [magneticHover, prefersReducedMotion]
  )

  const handleMouseLeave = useCallback(() => {
    setMagnet({ x: 0, y: 0 })
    setTilt({ x: 0, y: 0 })
  }, [])

  const handleEnter = () => {
    setVisionShoutoutSeen(userId)
    onEnter()
  }

  return (
    <AnimatePresence onExitComplete={() => onEntered?.()}>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-xl rounded-[2.5rem] border border-white/20 bg-white/60 p-8 sm:p-10 text-center shadow-[0_25px_50px_-12px_rgba(59,130,246,0.1)]"
        >
          <div
            ref={cardRef}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
          {/* Layer 2: Hero Logo with breathe */}
          <motion.div
            className="flex justify-center mb-6"
            animate={
              prefersReducedMotion
                ? { scale: 1 }
                : { scale: [0.98, 1.02, 0.98] }
            }
            transition={
              prefersReducedMotion
                ? {}
                : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <div className="scale-150 origin-center">
              <Logo iconSize="lg" showText={false} />
            </div>
          </motion.div>

          {/* Headline: elegant gradient */}
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 mb-4">
            Your Research, Redefined as Art.
          </h2>

          {/* Body: airy line-height */}
          <p className="text-lg text-slate-500 max-w-[85%] mx-auto mb-6 leading-relaxed">
            In a world of infinite tabs, SmarTrack is your sanctuary. We&apos;ve turned your
            scattered bookmarks into a visual discovery canvas designed for the modern builder.
          </p>

          {/* 3-dot progress: first blue */}
          <div className="flex justify-center gap-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>

          {/* CTA: "Start Capturing" with optional shimmer streak */}
          <motion.button
            ref={btnRef}
            onClick={handleEnter}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              x: magnet.x,
              y: magnet.y,
            }}
            className={`px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30 transition-colors ${!prefersReducedMotion ? 'btn-capture-shimmer' : ''}`}
          >
            Start Capturing
          </motion.button>

          {/* Micro-copy: productivity shortcut */}
          <p className="text-[10px] text-slate-400 mt-6">
            Ctrl+K to search anytime.
          </p>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
