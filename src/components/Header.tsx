import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";

interface HeaderProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showAdminButton?: boolean;
  showThemeToggle?: boolean;
  containerClassName?: string;
}

export function Header({
  leftContent,
  rightContent,
  showAdminButton = false,
  showThemeToggle = true,
  containerClassName,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-1 z-50 transition-all duration-300 ease-in-out",
        scrolled ? "px-2 sm:px-4 py-2" : "px-0 py-0"
      )}
    >
      <div
        className={cn(
          "mx-auto transition-all duration-300 ease-in-out flex items-center justify-between glass-card border-b border-white/[0.06]",
          scrolled
            ? "max-w-4xl h-14 rounded-3xl shadow-2xl px-4 sm:px-6"
            : "max-w-6xl h-16 rounded-sm border-x-0 border-t-0 px-6",
          containerClassName
        )}
      >
        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
          <Link to="/" className="shrink-0 flex items-center">
            <img
              src="/logo_fn.png"
              alt="F*cks News"
              className={cn(
                "drop-shadow-lg transition-all duration-300 hover:scale-105",
                scrolled ? "h-8" : "h-10 sm:h-12"
              )}
            />
          </Link>
          <div className={cn("transition-all duration-300 min-w-0", scrolled ? "hidden sm:block" : "block")}>
            {leftContent}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {showThemeToggle && <ThemeToggle />}
          {rightContent}
          {showAdminButton && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="sm:hidden">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Panel Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
