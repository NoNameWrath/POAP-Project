import React from 'react'

export function Card({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-2xl shadow-lg p-6 bg-white/80 backdrop-blur border border-gray-100 ${className}`}>{children}</div>
}
