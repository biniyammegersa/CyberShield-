export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-app-border bg-sidebar">
      <div className="h-8 flex items-center justify-center px-4">
        <p className="text-xs text-sidebar-muted">
          © {year} CyberShield
        </p>
      </div>
    </footer>
  );
}
