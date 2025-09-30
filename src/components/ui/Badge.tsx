import React from 'react'
export function Badge({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 ${className}`}>{children}</span>
}
