/**
 * RecipeFiltersBar Component
 *
 * Advanced filtering bar with dropdowns for track, level, skill, time, and search.
 */
'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface RecipeFiltersBarProps {
  filters: {
    track: string;
    level: string;
    skill: string;
    time: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onDebouncedSearch: (value: string) => void;
}

const TRACK_OPTIONS = [
  { value: 'all', label: 'All Tracks' },
  { value: 'defender', label: '🎯 Defender' },
  { value: 'offensive', label: '⚔️ Offensive' },
  { value: 'grc', label: '⚖️ GRC' },
  { value: 'innovation', label: '💡 Innovation' },
  { value: 'leadership', label: '👑 Leadership' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'mastery', label: 'Mastery' },
];

const SKILL_OPTIONS = [
  { value: 'all', label: 'All Skills' },
  { value: 'log_parsing', label: 'Log Parsing' },
  { value: 'siem_rule_writing', label: 'SIEM Rules' },
  { value: 'threat_intelligence', label: 'Threat Intel' },
  { value: 'network_analysis', label: 'Network Analysis' },
  { value: 'malware_analysis', label: 'Malware Analysis' },
  { value: 'incident_response', label: 'Incident Response' },
  { value: 'cloud_security', label: 'Cloud Security' },
];

const TIME_OPTIONS = [
  { value: 'any', label: 'Any Time' },
  { value: '15', label: '< 15 min' },
  { value: '30', label: '15–30 min' },
  { value: '60', label: '30–60 min' },
  { value: '61', label: '> 60 min' },
];

function Dropdown({
  options,
  value,
  onChange,
  placeholder
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
      >
        <span className={selectedOption?.value === 'all' || selectedOption?.value === 'any' ? 'text-slate-400' : 'text-slate-200'}>
          {selectedOption?.label || placeholder}
        </span>
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 focus:bg-slate-700/50 focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors"
            >
              <span className={option.value === 'all' || option.value === 'any' ? 'text-slate-400' : 'text-slate-200'}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecipeFiltersBar({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  onDebouncedSearch
}: RecipeFiltersBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:flex flex-col gap-4">
        {/* Top Row: Search + Clear */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipes, skills, tools..."
              value={filters.search}
              onChange={(e) => {
                onFilterChange('search', e.target.value);
                onDebouncedSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Bottom Row: Filter Dropdowns */}
        <div className="flex items-center gap-4">
          <Dropdown
            options={TRACK_OPTIONS}
            value={filters.track}
            onChange={(value) => onFilterChange('track', value)}
            placeholder="Select Track"
          />
          <Dropdown
            options={LEVEL_OPTIONS}
            value={filters.level}
            onChange={(value) => onFilterChange('level', value)}
            placeholder="Select Level"
          />
          <Dropdown
            options={SKILL_OPTIONS}
            value={filters.skill}
            onChange={(value) => onFilterChange('skill', value)}
            placeholder="Select Skill"
          />
          <Dropdown
            options={TIME_OPTIONS}
            value={filters.time}
            onChange={(value) => onFilterChange('time', value)}
            placeholder="Select Time"
          />
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.track !== 'all' && filters.track && (
              <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                Track: {TRACK_OPTIONS.find(t => t.value === filters.track)?.label}
              </Badge>
            )}
            {filters.level !== 'all' && filters.level && (
              <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                Level: {LEVEL_OPTIONS.find(l => l.value === filters.level)?.label}
              </Badge>
            )}
            {filters.skill !== 'all' && filters.skill && (
              <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                Skill: {SKILL_OPTIONS.find(s => s.value === filters.skill)?.label}
              </Badge>
            )}
            {filters.time !== 'any' && filters.time && (
              <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30 text-amber-300">
                Time: {TIME_OPTIONS.find(t => t.value === filters.time)?.label}
              </Badge>
            )}
            {filters.search && (
              <Badge variant="outline" className="bg-slate-500/20 border-slate-500/30 text-slate-300">
                Search: "{filters.search}"
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 mb-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={filters.search}
              onChange={(e) => {
                onFilterChange('search', e.target.value);
                onDebouncedSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>

          {/* Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="solid" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Dropdown
                options={TRACK_OPTIONS}
                value={filters.track}
                onChange={(value) => onFilterChange('track', value)}
                placeholder="Track"
              />
              <Dropdown
                options={LEVEL_OPTIONS}
                value={filters.level}
                onChange={(value) => onFilterChange('level', value)}
                placeholder="Level"
              />
              <Dropdown
                options={SKILL_OPTIONS}
                value={filters.skill}
                onChange={(value) => onFilterChange('skill', value)}
                placeholder="Skill"
              />
              <Dropdown
                options={TIME_OPTIONS}
                value={filters.time}
                onChange={(value) => onFilterChange('time', value)}
                placeholder="Time"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
