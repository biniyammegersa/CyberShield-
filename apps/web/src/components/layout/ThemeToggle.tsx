import { useTheme } from '@/lib/theme';

export function ThemeToggle({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
  const { isDark, toggleTheme } = useTheme();

  const icon = isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
          <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  const label = isDark ? 'Light mode' : 'Dark mode';

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-fg hover:bg-sidebar-hover transition-colors"
        aria-label={label}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-sidebar-muted hover:text-app-fg hover:bg-sidebar-hover transition-colors"
      aria-label={label}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
