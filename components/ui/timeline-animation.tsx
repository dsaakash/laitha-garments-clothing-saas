"use client"

import React from "react"
import { motion, useInView } from "framer-motion"

interface TimelineContentProps {
  as?: React.ElementType
  animationNum?: number
  timelineRef?: React.RefObject<Element>
  customVariants?: any
  className?: string
  children: React.ReactNode
}

export function TimelineContent({
  as: Component = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const defaultRef = React.useRef(null)
  const ref = timelineRef || defaultRef
  const isInView = useInView(ref as any, { once: true, margin: "-100px" })

  const MotionComponent = motion(Component as any)

  return (
    <MotionComponent
      ref={defaultRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={customVariants}
      className={className}
    >
      {children}
    </MotionComponent>
  )
}
