import { Loader2Icon } from 'lucide-react'

import { cn } from './utils'

// Only the class is forwarded: the apps resolve lucide against their own copy
// of @types/react, and spreading props typed against another copy breaks
// their builds.
function Spinner({ className }: { className?: string }) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
    />
  )
}

export { Spinner }
