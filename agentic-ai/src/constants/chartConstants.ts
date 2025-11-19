/**
 * Chart configuration constants
 */

// Chart color palette
export const CHART_COLORS = {
  success: {
    background: 'rgba(16, 185, 129, 0.8)',
    border: 'rgba(16, 185, 129, 1)',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.8)',
    border: 'rgba(245, 158, 11, 1)',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.8)',
    border: 'rgba(239, 68, 68, 1)',
  },
  errorRate: {
    border: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
  },
} as const

// Chart configuration
export const CHART_CONFIG = {
  borderWidth: 2,
  pointRadius: 4,
  pointHoverRadius: 6,
  tension: 0.4,
  legendPadding: 15,
  legendFontSize: 12,
  axisFontSize: 11,
  axisTitleFontSize: 12,
} as const

// Resolution efficiency thresholds
export const EFFICIENCY_THRESHOLDS = {
  EXCELLENT: 3, // < 3 requests per session
  GOOD: 5, // 3-5 requests per session
  MODERATE: 8, // 5-8 requests per session
  // > 8 is poor
} as const

