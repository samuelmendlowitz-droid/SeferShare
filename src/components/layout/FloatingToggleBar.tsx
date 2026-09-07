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

  return (
    <div
      className="flex w-full items-center gap-1 rounded-pill border border-[rgba(214,228,240,0.6)]
        bg-[rgba(255,255,255,0.72)] px-1.5 py-1.5 shadow-navbar backdrop-blur-md"
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
          className="h-9 w-full min-w-0 rounded-pill bg-transparent px-3 text-sm text-text
            placeholder:text-text-muted focus:outline-none"
        />
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-pill px-3 text-sm
                font-medium transition-colors duration-200
                ${
                  activeKey === option.key
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:bg-white/60 hover:text-accent'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
