import * as React from "react"
import { Check, ChevronDown, ChevronRight, X } from "lucide-react"

import { cn } from "../../lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface Option {
  value: string
  label: string
}

interface SearchableSelectFooterAction {
  label: string
  onClick: () => void
}

interface SearchableSelectProps {
  options: Option[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  hideSearch?: boolean
  hideClearIcon?: boolean
  /** Link dưới danh sách (ví dụ mở dialog tra cứu đầy đủ) */
  footerAction?: SearchableSelectFooterAction
  /** Giống nút filter secondary trên ShipmentsPage (pill + chevron phải). */
  variant?: "default" | "filterChip"
  /** Icon trái khi variant = filterChip */
  leadingIcon?: React.ReactNode
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
  hideSearch = false,
  hideClearIcon = false,
  footerAction,
  variant = "default",
  leadingIcon,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            variant === "filterChip"
              ? cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm w-auto min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
                  open
                    ? "bg-primary/5 border-primary text-primary"
                    : "bg-white border-border hover:bg-muted text-muted-foreground",
                  !selectedOption && "text-muted-foreground/60",
                )
              : cn(
                  "flex h-10 w-full items-center justify-between rounded-full border border-border/80 bg-white px-4 text-[13px] font-bold shadow-sm transition-all hover:bg-muted/15 focus:outline-none focus:ring-2 focus:ring-primary/10",
                  open && "border-primary ring-2 ring-primary/5",
                  !selectedOption && "text-muted-foreground/60",
                ),
            className,
          )}
        >
          {variant === "filterChip" && leadingIcon ? (
            <span className={cn("shrink-0", open ? "text-primary" : "text-muted-foreground/50")}>
              {leadingIcon}
            </span>
          ) : null}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={cn("flex items-center gap-1.5 shrink-0", variant === "filterChip" ? "ml-1" : "ml-2")}>
            {value && !disabled && !hideClearIcon && (
              <X
                size={14}
                className="text-muted-foreground/40 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange("")
                }}
              />
            )}
            {variant === "filterChip" ? (
              <ChevronRight
                size={14}
                className={cn("opacity-40 transition-transform", open ? "-rotate-90" : "rotate-90")}
              />
            ) : (
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted-foreground/40 transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/60">
        <Command className="rounded-xl overflow-hidden">
          {!hideSearch && (
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9 text-[13px] focus:ring-0"
            />
          )}
          <CommandList className="max-h-60 p-1">
            <CommandEmpty className="py-6 text-[12px] text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] font-medium transition-colors hover:bg-primary/5",
                    value === option.value && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  {option.label}
                  {value === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {footerAction && (
          <div className="border-t border-border/80 px-1 py-1">
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold text-primary hover:bg-primary/5 transition-colors"
              onClick={() => {
                setOpen(false)
                footerAction.onClick()
              }}
            >
              {footerAction.label}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
