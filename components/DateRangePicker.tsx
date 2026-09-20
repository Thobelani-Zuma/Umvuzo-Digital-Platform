import React from 'react';
import { DateRange, getPresetRange, formatDisplayDate } from '../utils/dateUtils';
import { CalendarIcon, CloseIcon } from './icons/Icons';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  activeCount?: number;
  className?: string;
}

type PresetType = 'all' | 'today' | 'yesterday' | 'week' | 'month';

export function DateRangePicker({
  value,
  onChange,
  activeCount,
  className = '',
}: DateRangePickerProps) {
  const isFiltered = Boolean(value.startDate || value.endDate);

  // Determine current active preset if matching
  const getActivePreset = (): PresetType | 'custom' => {
    if (!value.startDate && !value.endDate) return 'all';

    const todayRange = getPresetRange('today');
    if (value.startDate === todayRange.startDate && value.endDate === todayRange.endDate) {
      return 'today';
    }

    const yestRange = getPresetRange('yesterday');
    if (value.startDate === yestRange.startDate && value.endDate === yestRange.endDate) {
      return 'yesterday';
    }

    const weekRange = getPresetRange('week');
    if (value.startDate === weekRange.startDate && value.endDate === weekRange.endDate) {
      return 'week';
    }

    const monthRange = getPresetRange('month');
    if (value.startDate === monthRange.startDate && value.endDate === monthRange.endDate) {
      return 'month';
    }

    return 'custom';
  };

  const activePreset = getActivePreset();

  const handlePresetClick = (preset: PresetType) => {
    onChange(getPresetRange(preset));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    onChange({
      startDate: newStart,
      endDate: value.endDate && newStart && value.endDate < newStart ? newStart : value.endDate,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    onChange({
      startDate: value.startDate && newEnd && value.startDate > newEnd ? newEnd : value.startDate,
      endDate: newEnd,
    });
  };

  const handleReset = () => {
    onChange({ startDate: '', endDate: '' });
  };

  const presets: { id: PresetType; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col gap-3 text-sm ${className}`}
    >
      {/* Preset Buttons & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center text-gray-500 mr-1">
            <CalendarIcon className="h-4 w-4 mr-1 text-brand-green" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Filter:
            </span>
          </div>

          {presets.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors py-1 px-2 rounded hover:bg-red-50"
            title="Reset to All Time"
          >
            <CloseIcon className="h-3.5 w-3.5" />
            <span>Clear Filter</span>
          </button>
        )}
      </div>

      {/* Date Inputs & Summary Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="dashboard-date-start" className="text-xs text-gray-500 font-medium">
              From:
            </label>
            <input
              id="dashboard-date-start"
              type="date"
              value={value.startDate}
              onChange={handleStartDateChange}
              className="py-1 px-2 border border-gray-300 rounded-md text-xs text-gray-700 focus:ring-1 focus:ring-brand-orange focus:border-brand-orange bg-white shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="dashboard-date-end" className="text-xs text-gray-500 font-medium">
              To:
            </label>
            <input
              id="dashboard-date-end"
              type="date"
              value={value.endDate}
              onChange={handleEndDateChange}
              className="py-1 px-2 border border-gray-300 rounded-md text-xs text-gray-700 focus:ring-1 focus:ring-brand-orange focus:border-brand-orange bg-white shadow-inner"
            />
          </div>
        </div>

        {/* Date status badge / count */}
        <div className="text-xs text-gray-500 flex items-center gap-2 ml-auto">
          {isFiltered ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-brand-orange border border-orange-200">
              {value.startDate && value.endDate
                ? `${formatDisplayDate(value.startDate)} – ${formatDisplayDate(value.endDate)}`
                : value.startDate
                ? `From ${formatDisplayDate(value.startDate)}`
                : `Up to ${formatDisplayDate(value.endDate)}`}
            </span>
          ) : (
            <span className="text-gray-400">All dates shown</span>
          )}

          {typeof activeCount === 'number' && (
            <span className="font-semibold text-gray-700">
              ({activeCount.toLocaleString()} {activeCount === 1 ? 'entry' : 'entries'})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
