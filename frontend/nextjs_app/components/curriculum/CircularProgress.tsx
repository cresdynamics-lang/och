/**
 * CircularProgress Component
 * 
 * Animated circular progress indicator for curriculum modules.
 */
'use client';

import { motion } from 'framer-motion';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  bgColor?: string;
}

export function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 4,
  className = 'text-emerald-400',
  showPercentage = false,
  bgColor = 'text-slate-700',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={`stroke-current ${bgColor}`}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`stroke-current ${className}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${className}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

