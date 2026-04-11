import React from 'react'
import { colors, button } from '../styles/designSystem'

export default function GlassButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  ...props
}) {
  const baseStyle = variant === 'primary' ? button.primary : button.secondary

  const sizeMap = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.8125rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.875rem' },
    lg: { padding: '1rem 2rem', fontSize: '0.9375rem' },
  }

  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeMap[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered && !disabled ? `0 8px 20px rgba(0,0,0,0.2)` : 'none',
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {Icon && <Icon size={16} style={{ marginRight: '0.5rem' }} />}
      {children}
    </button>
  )
}
