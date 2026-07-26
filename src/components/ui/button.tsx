import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "rounded-full",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97] active:translate-y-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Solid filled teal — most visible, used for primary actions
        default:
          "bg-[#12AFAB] text-white border border-[#0e9a96] shadow-[0_4px_16px_rgba(18,175,171,0.4)] hover:bg-[#0e9a96] hover:shadow-[0_8px_24px_rgba(18,175,171,0.5)]",
        destructive:
          "bg-red-500 text-white border border-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.35)] hover:bg-red-600",
        // Light teal outline pill
        outline:
          "bg-[#eaf7f6] text-[#12AFAB] border border-[#12AFAB]/40 shadow-[0_2px_8px_rgba(18,175,171,0.12)] hover:bg-[#d4f0ee] hover:border-[#12AFAB]/70",
        secondary:
          "bg-[#eaf7f6] text-[#12AFAB] border border-[#12AFAB]/30 hover:bg-[#d4f0ee]",
        ghost:
          "bg-transparent border-transparent shadow-none text-slate-600 hover:bg-[#eaf7f6] hover:text-[#12AFAB]",
        link:
          "bg-transparent border-transparent shadow-none text-[#12AFAB] underline-offset-4 hover:underline hover:translate-y-0 hover:scale-100",
        liquid:
          "bg-[#12AFAB] text-white border border-[#0e9a96] shadow-[0_4px_16px_rgba(18,175,171,0.4)] hover:bg-[#0e9a96]",
        "liquid-outline":
          "bg-white/20 text-white border border-white/50 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white/30",
        "liquid-nav":
          "bg-[#12AFAB] text-white border border-[#0e9a96] shadow-[0_2px_10px_rgba(18,175,171,0.35)] hover:bg-[#0e9a96]",
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
