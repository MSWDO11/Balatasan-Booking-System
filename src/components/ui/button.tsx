import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: pill shape, glass effect, smooth transitions
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "rounded-full", // pill shape like iOS
    "backdrop-blur-md",
    "border border-white/30",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97] active:translate-y-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — teal glass pill
        default:
          "bg-primary/80 text-white border-primary/40 shadow-[0_4px_20px_rgba(18,175,171,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-primary/90 hover:shadow-[0_8px_32px_rgba(18,175,171,0.55),inset_0_1px_0_rgba(255,255,255,0.3)]",
        // Destructive — red glass pill
        destructive:
          "bg-destructive/80 text-white border-destructive/40 shadow-[0_4px_16px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-destructive/90",
        // Outline — transparent glass pill
        outline:
          "bg-white/10 text-foreground border-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-white/20 hover:border-white/60",
        // Secondary — light glass pill
        secondary:
          "bg-secondary/70 text-secondary-foreground border-secondary/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-secondary/90",
        // Ghost — very subtle
        ghost:
          "bg-transparent border-transparent shadow-none hover:bg-white/15 hover:border-white/20",
        // Link
        link:
          "bg-transparent border-transparent shadow-none text-primary underline-offset-4 hover:underline hover:translate-y-0 hover:scale-100",
        // Legacy liquid variants (kept for compatibility)
        liquid:
          "bg-primary/80 text-white border-primary/40 shadow-[0_4px_20px_rgba(18,175,171,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-primary/90",
        "liquid-outline":
          "bg-white/10 text-white border-white/45 shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-white/22",
        "liquid-nav":
          "bg-primary/10 text-primary border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-primary/18",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-10 w-10",
        fluid: "h-12 px-8 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
