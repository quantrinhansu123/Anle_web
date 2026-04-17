import * as React from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export interface ThreeStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  /** Star icon next to label (vd. Customer Rating) */
  showStarInLabel?: boolean;
  labelClassName?: string;
  /** framed: framed background like customer dialog; inline: only star row */
  variant?: 'framed' | 'inline';
  className?: string;
}

const STARS = [1, 2, 3] as const;

export function ThreeStarRating({
  value,
  onChange,
  disabled = false,
  label,
  showStarInLabel = false,
  labelClassName = 'text-[13px] font-bold text-foreground',
  variant = 'framed',
  className,
}: ThreeStarRatingProps) {
  const [hoverRank, setHoverRank] = React.useState<number | null>(null);

  const displayRank = hoverRank !== null ? hoverRank : (value || 0);

  const starsRow = (
    <div
      className={clsx(
        'flex items-center gap-2',
        variant === 'framed' && 'h-[38px] px-3 bg-muted/5 border border-border rounded-xl w-max',
        variant === 'inline' && 'gap-1.5',
      )}
      onMouseLeave={() => !disabled && setHoverRank(null)}
    >
      {STARS.map((star) => {
        const isFull = displayRank >= star;
        const isHalf = displayRank === star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseMove={(e) => {
              if (disabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const mid = rect.left + rect.width / 2;
              setHoverRank(e.clientX < mid ? star - 0.5 : star);
            }}
            onClick={() => {
              if (disabled) return;
              onChange(hoverRank !== null ? hoverRank : star);
            }}
            className={clsx(
              'flex items-center justify-center focus:outline-none focus:scale-110 transition-transform',
              disabled ? 'cursor-default opacity-70' : 'hover:bg-slate-100',
              variant === 'framed' && 'p-1 rounded-md relative w-7 h-7',
              variant === 'inline' && 'relative w-6 h-6 rounded-md hover:bg-slate-100 disabled:hover:bg-transparent',
            )}
          >
            <div className={clsx('relative', variant === 'framed' ? 'w-5 h-5' : 'w-5 h-5')}>
              <Star
                size={20}
                className={clsx(
                  'absolute inset-0 fill-slate-200 text-slate-300',
                  variant === 'inline' && 'm-auto',
                )}
              />
              {(isFull || isHalf) && (
                <div
                  className={clsx(
                    'absolute inset-y-0 left-0 overflow-hidden text-left',
                    isHalf ? 'w-[50%]' : 'w-full',
                  )}
                >
                  <Star
                    size={20}
                    className={clsx(
                      'fill-amber-400 text-amber-400 drop-shadow-sm min-w-[20px]',
                      variant === 'inline' && 'm-auto',
                    )}
                  />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  if (!label) {
    return <div className={className}>{starsRow}</div>;
  }

  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-center gap-2 mb-1.5">
        {showStarInLabel && <Star size={16} className="text-muted-foreground/70 shrink-0" />}
        <span className={labelClassName}>{label}</span>
      </div>
      {starsRow}
    </div>
  );
}
