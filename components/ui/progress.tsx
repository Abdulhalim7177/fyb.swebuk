import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
  >
    <div
      className={cn(
        "h-4 w-full flex-1 rounded-full bg-primary transition-all",
        className
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      <div
        className={cn(
          "h-full bg-primary/50 rounded-full",
          className
        )}
        style={{ transform: `translateX(${100 - (value || 0)}%)` }}
      />
    </div>
  </div>
))

export { Progress }