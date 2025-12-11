'use client';

import { Moon, Sun, Monitor, Contrast, Activity, Eye } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useHealthcareTheme } from '@/providers/healthcare-theme-context';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { config, updateConfig } = useHealthcareTheme();

  const toggleHighContrast = () => {
    updateConfig({ highContrastMode: !config.highContrastMode });
  };

  const toggleReducedMotion = () => {
    updateConfig({ reducedMotion: !config.reducedMotion });
  };

  const toggleLargeText = () => {
    updateConfig({ largeTextMode: !config.largeTextMode });
  };

  const toggleEmergencyMode = () => {
    updateConfig({ emergencyMode: !config.emergencyMode });
  };

  const setColorBlindMode = (mode: typeof config.colorBlindMode) => {
    updateConfig({ colorBlindMode: mode });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Healthcare Themes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme('clinical')}>
          <Activity className="mr-2 h-4 w-4" />
          <span>Clinical</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Optimized for clinics
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme('emergency');
            toggleEmergencyMode();
          }}
          className={config.emergencyMode ? 'bg-destructive/10 text-destructive' : ''}
        >
          <div className={`mr-2 h-4 w-4 ${config.emergencyMode ? 'animate-pulse' : ''}`}>
            🚨
          </div>
          <span>Emergency</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Critical situations
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Department Themes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme('emergency-department')}>
          <div className="mr-2 h-4 w-4">🏥</div>
          <span>Emergency Dept</span>
          <div className="ml-auto text-xs text-muted-foreground">
            High energy red
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('pediatrics')}>
          <div className="mr-2 h-4 w-4">👶</div>
          <span>Pediatrics</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Child-friendly blue
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('surgery')}>
          <div className="mr-2 h-4 w-4">⚕️</div>
          <span>Surgery</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Precise blue
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('cardiology')}>
          <div className="mr-2 h-4 w-4">❤️</div>
          <span>Cardiology</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Deep red theme
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('radiology')}>
          <div className="mr-2 h-4 w-4">🔬</div>
          <span>Radiology</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Cool purple
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('laboratory')}>
          <div className="mr-2 h-4 w-4">🧪</div>
          <span>Laboratory</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Scientific teal
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('pharmacy')}>
          <div className="mr-2 h-4 w-4">💊</div>
          <span>Pharmacy</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Medical green
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('night-shift')}>
          <div className="mr-2 h-4 w-4">🌙</div>
          <span>Night Shift</span>
          <div className="ml-auto text-xs text-muted-foreground">
            Reduced blue light
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
        <DropdownMenuItem onClick={toggleHighContrast}>
          <Contrast className="mr-2 h-4 w-4" />
          <span>High Contrast</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.highContrastMode ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Color Blind Support</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setColorBlindMode('none')}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Normal</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.colorBlindMode === 'none' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorBlindMode('protanopia')}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Protanopia</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.colorBlindMode === 'protanopia' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorBlindMode('deuteranopia')}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Deuteranopia</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.colorBlindMode === 'deuteranopia' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorBlindMode('tritanopia')}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Tritanopia</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.colorBlindMode === 'tritanopia' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Display Options</DropdownMenuLabel>
        <DropdownMenuItem onClick={toggleReducedMotion}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Reduced Motion</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.reducedMotion ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleLargeText}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Large Text</span>
          <div className="ml-auto">
            <div className={`h-2 w-2 rounded-full ${config.largeTextMode ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}