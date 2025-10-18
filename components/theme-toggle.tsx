'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </Button>
  );
}
