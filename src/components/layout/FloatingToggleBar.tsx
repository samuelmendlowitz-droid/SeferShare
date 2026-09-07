import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, CloseIcon } from '../ui/icons';

export interface ToggleOption {
  key: string;
  label: string;
}

interface FloatingToggleBarProps {
  options: ToggleOption[];
  activeKey: string;
  onChange: (key: string) => void;
  onSearch: (query: string) => void;
}

export function FloatingToggleBar({ options, activeKey, onChange, onSearch }: FloatingToggleBarProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const activeIndex = Math.max(0, options.findIndex((o) => o.key === activeKey));

  return (
    <div
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1
        rounded-pill border border-[rgba(214,228,240,0.6)] bg-[rgba(255,255,255,0.72)]
        px-1.5 py-1.5 shadow-navbar backdrop-blur-md transition-all duration-250"
    >
      <button
        type="button"
        aria-label={t('nav.search')}
        onClick={() => setSearchOpen((v) => !v)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-accent
          transition-colors duration-200 hover:bg-white/60"
      >
        {searchOpen ? <CloseIcon width={18} height={18} /> : <SearchIcon width={18} height={18} />}
      </button>

      {searchOpen ? (
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder={t('nav.searchPlaceholder') ?? ''}
          className="h-9 w-48 rounded-pill bg-transparent px-3 text-sm text-text
            placeholder:text-text-muted focus:outline-none sm:w-64"
        />
      ) : (
        <div className="relative flex items-center">
          <div
            className="absolute h-9 rounded-pill bg-accent transition-transform duration-250 ease-in-out"
            style={{
              width: `${100 / options.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
              left: 0,
              right: 0,
            }}
          />
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`relative z-10 h-9 flex-1 whitespace-nowrap rounded-pill px-3 text-sm
                font-medium transition-colors duration-200
                ${activeKey === option.key ? 'text-white' : 'text-text-muted hover:text-accent'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
