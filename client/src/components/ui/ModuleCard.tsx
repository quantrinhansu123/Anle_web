import React from 'react';
import { clsx } from 'clsx';
import { HelpCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookmarks } from '../../hooks/useBookmarks';

export interface ModuleCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  colorScheme: 'red' | 'green' | 'pink' | 'blue' | 'orange' | 'teal' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'slate';
  path?: string;
}

const colorMap = {
  red: 'bg-red-500/10 text-red-500',
  green: 'bg-emerald-500/10 text-emerald-500',
  pink: 'bg-pink-500/10 text-pink-500',
  blue: 'bg-blue-500/10 text-blue-500',
  orange: 'bg-orange-500/10 text-orange-500',
  teal: 'bg-teal-500/10 text-teal-500',
  purple: 'bg-purple-500/10 text-purple-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-500/10 text-amber-500',
  slate: 'bg-slate-500/10 text-slate-500',
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  icon: Icon,
  title,
  description,
  colorScheme,
  path
}) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
  };

  const isFav = path ? isBookmarked(path) : false;

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "group flex items-center bg-card rounded-xl p-4 transition-all duration-300 border border-border hover:border-primary/30 hover:shadow-sm cursor-pointer hover:-translate-y-0.5",
        !path && "opacity-60 grayscale-[0.5] cursor-not-allowed hover:translate-y-0 hover:border-border"
      )}
    >
      <div
        className={clsx(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mr-3 transition-transform group-hover:scale-110",
          colorMap[colorScheme]
        )}
      >
        <Icon size={22} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h3 className="font-bold text-[14px] text-foreground mb-0.5 truncate transition-colors">
          {title}
        </h3>
        <p className="text-[12px] text-muted-foreground truncate leading-snug">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => path && toggleBookmark(path)}
          className={clsx(
            "transition-colors",
            isFav ? "text-amber-500" : "text-muted-foreground/30 hover:text-amber-500"
          )}
          title="Bookmark"
        >
          <Star size={15} fill={isFav ? "currentColor" : "none"} />
        </button>
        <button className="text-muted-foreground/30 hover:text-primary transition-colors" title="Hướng dẫn sử dụng">
          <HelpCircle size={15} />
        </button>
      </div>
    </div>
  );
};
