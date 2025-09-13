/**
 * Demo Watermark Component
 * Subtle indicator that user is viewing demo data
 */

import React from 'react';

interface DemoWatermarkProps {
  isVisible: boolean;
  scenarioName?: string;
}

export default function DemoWatermark({ isVisible, scenarioName }: DemoWatermarkProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Fixed watermark in corner */}
      <div className="fixed top-20 right-4 z-40 pointer-events-none">
        <div className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-blue-400/50">
          <span className="hidden sm:inline">🎭 Demo: </span>
          {scenarioName || 'Demo Mode'}
        </div>
      </div>

      {/* Subtle background pattern for demo indication */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ctext x='50%25' y='50%25' font-family='monospace' font-size='8' text-anchor='middle' dy='.3em'%3EDEMO%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        />
      </div>
    </>
  );
}