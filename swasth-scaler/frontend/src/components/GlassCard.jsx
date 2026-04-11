import React from 'react'
import { glass, colors } from '../styles/designSystem'

export default function GlassCard({
  children,
  hover = true,
  padding = '1.5rem',
  variant = 'container'
}) {
  const [isHovered, setIsHovered] = React.useState(false)

  const baseStyle = variant === 'container' ? glass.container : glass.card
  const style = hover && isHovered
    ? { ...baseStyle, ...glass.containerHover }
    : baseStyle

  return (
    <div
      style={{
        ...style,
        padding,
        transition: 'all 0.3s ease',
        cursor: hover ? 'default' : 'auto',
      }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      {children}
    </div>
  )
}
