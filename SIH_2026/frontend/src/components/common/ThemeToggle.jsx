import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// Enterprise Cyber Theme Toggle Button
export default function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] select-none ${
        isDark 
          ? 'bg-[#12233C] text-[#00C2FF] hover:bg-[#1A3355] border border-[#1E3A5F]' 
          : 'bg-[#123C69]/50 text-slate-200 hover:bg-[#123C69] hover:text-white border border-[#123C69]'
      } ${className}`}
      title={isDark ? 'Switch to Light Console Mode' : 'Switch to Dark SOC Mode'}
      aria-label="Toggle display theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45 text-[#00C2FF]" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0 text-amber-300" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-wider uppercase font-mono">
          {isDark ? 'Dark SOC' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
