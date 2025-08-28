import React from 'react';

export default function SnowballBoostMeter({
  value, onChange, min = 0, max = 1000, step = 5
}) {
  const id = 'snowball-amount';
  const snapPoints = [25, 50, 100, 250, 500];
  const snapTolerance = 2;

  // Smart snapping logic
  const handleSliderChange = (newValue) => {
    // Check if we're within snap tolerance of any snap point
    for (const snapPoint of snapPoints) {
      if (Math.abs(newValue - snapPoint) <= snapTolerance) {
        onChange(snapPoint);
        return;
      }
    }
    onChange(newValue);
  };

  const handlePresetClick = (presetValue) => {
    onChange(presetValue);
  };

  // Generate tick marks for snap points
  const renderTicks = () => {
    return snapPoints.map(snapPoint => {
      const position = (snapPoint / max) * 100;
      return (
        <div
          key={snapPoint}
          className="absolute w-0.5 h-2 bg-green-400 rounded-full"
          style={{ left: `${position}%`, top: '50%', transform: 'translateY(-50%)' }}
        />
      );
    });
  };

  return (
    <div className="h-full rounded-2xl border bg-white p-4 flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        Boost Your Payments
      </label>

      {/* Current value display */}
      <div className="mt-2 mb-2">
        <span className="text-2xl font-bold text-green-600">£{value}</span>
      </div>

      {/* Slider with tick marks */}
      <div className="relative mb-4">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => handleSliderChange(Number(e.target.value))}
          className="w-full accent-green-600
            appearance-none h-2 rounded-full bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-green-600
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-600
            [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(value / max) * 100}%, #e5e7eb ${(value / max) * 100}%, #e5e7eb 100%)`
          }}
          aria-valuemin={min} 
          aria-valuemax={max} 
          aria-valuenow={value}
          aria-label="Snowball amount"
        />
        
        {/* Tick marks */}
        <div className="absolute inset-0 pointer-events-none">
          {renderTicks()}
        </div>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {snapPoints.map(preset => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              value === preset
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
            }`}
          >
            £{preset}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Add a little extra each month to speed up your snowball.
      </p>
    </div>
  );
}