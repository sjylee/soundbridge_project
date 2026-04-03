import { Outlet, Link, useLocation } from "react-router-dom";
import { Ear, AudioWaveform, BarChart3, Home, Music } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/audiogram", label: "Audiogram", icon: Ear },
  { path: "/process", label: "Process", icon: AudioWaveform },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <AudioWaveform className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute inset-0 w-9 h-9 rounded-lg bg-primary/10 animate-pulse-glow" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Sound<span className="text-primary">Bridge</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile nav */}
            <nav className="flex sm:hidden items-center gap-1" role="navigation" aria-label="Mobile navigation">
              {NAV_ITEMS.map(({ path, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`p-2.5 rounded-lg transition-all ${
                      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            SoundBridge — Making music accessible for everyone
          </p>
        </div>
      </footer>
    </div>
  );
}