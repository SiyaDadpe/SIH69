import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <div
    className={cn(
      "border-input w-full rounded-md border bg-white dark:bg-input/30 px-3 py-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
      className
    )}
  >
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center")}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#F5F5F5]">
        <SliderPrimitive.Range className="absolute h-full bg-[#BA7967]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[#BA7967] bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BA7967] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  </div>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
