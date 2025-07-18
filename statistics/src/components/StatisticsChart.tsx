import React from 'react'
import { Chart } from 'react-chartjs-2'
import { ApiCallsStatisticsResponse, MakeStatisticsResponse, DatabaseStatisticsResponse, CloudinaryStatisticsResponse, StatisticsSummary, TimeUnit } from '../models/Statistics.model'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController
)

interface StatisticsChartProps {
  data: ApiCallsStatisticsResponse | MakeStatisticsResponse | DatabaseStatisticsResponse | CloudinaryStatisticsResponse | null
  summary: StatisticsSummary
  timeUnit: TimeUnit
  chartLegends: {
    agreement: string
    withinPeriod: string
    total: string
  }
  isLoading: boolean
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({
  data,
  summary,
  timeUnit,
  chartLegends,
  isLoading,
}) => {
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const createChartData = () => {
    // Handle case where data is null or undefined
    if (!data || !data.tenantUsage || !data.tenantUsage.range || !data.tenantUsage.range.values) {
      return {
        labels: [],
        datasets: [
          {
            type: 'line' as const,
            label: chartLegends.agreement,
            data: [],
            borderColor: '#9ca3af',
            backgroundColor: 'transparent',
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 2,
            borderDash: [5, 5],
          },
          {
            type: 'bar' as const,
            label: chartLegends.withinPeriod,
            data: [],
            backgroundColor: '#6b7280',
            borderColor: '#6b7280',
            borderWidth: 1,
          },
          {
            type: 'line' as const,
            label: chartLegends.total,
            data: [],
            borderColor: '#000000',
            backgroundColor: 'transparent',
            tension: 0.1,
          },
        ],
      }
    }

    // Helper function to get the value from API calls, Make, Database, or Cloudinary data
    const getValue = (item: any): number => {
      if ('value' in item) {
        return item.value || 0 // API calls data
      } else if ('operations' in item) {
        return item.operations || 0 // Make data
      } else if ('totalBytes' in item) {
        return item.totalBytes || 0 // Database data
      } else if ('storageBytes' in item) {
        return item.storageBytes || 0 // Cloudinary data
      }
      return 0
    }

    // Check if this is database or cloudinary data (no cumulative series)
    const isDatabaseData = data.tenantUsage.range.values.some((item: any) => 'totalBytes' in item)
    const isCloudinaryData = data.tenantUsage.range.values.some((item: any) => 'storageBytes' in item)
    const skipCumulativeSeries = isDatabaseData || isCloudinaryData

    // Create base datasets (agreement line and bar chart)
    const baseDatasets = [
      {
        type: 'line' as const,
        label: chartLegends.agreement,
        data: data.tenantUsage.range.values.map(() => summary.agreedAnnual || 0),
        borderColor: '#9ca3af',
        backgroundColor: 'transparent',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
        borderDash: [5, 5],
      },
      {
        type: 'bar' as const,
        label: chartLegends.withinPeriod,
        data: data.tenantUsage.range.values.map((item: any) => getValue(item)).reverse(),
        backgroundColor: '#6b7280',
        borderColor: '#6b7280',
        borderWidth: 1,
      },
    ]

    // Add cumulative line only for API calls and Make data (skip for database and cloudinary)
    const datasets = skipCumulativeSeries ? baseDatasets : [
      ...baseDatasets,
      {
        type: 'line' as const,
        label: chartLegends.total,
        data: data.tenantUsage.range.values.map((_: any, index: number) => {
          // Calculate cumulative sum for the line chart (reverse order for chronological)
          const values = data.tenantUsage.range.values.slice().reverse()
          return values.slice(0, index + 1).reduce((sum: number, d: any) => sum + getValue(d), 0)
        }),
        borderColor: '#000000',
        backgroundColor: 'transparent',
        tension: 0.1,
      },
    ]

    return {
      labels: data.tenantUsage.range.values
        .map((item: any) => {
          const date = new Date(item.date)
          if (timeUnit === 'day') {
            return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
          } else if (timeUnit === 'week') {
            return `Week ${getWeekNumber(date)}`
          } else {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          }
        })
        .reverse(),
      datasets,
    }
  }

  // Check if this is database or cloudinary data to add GB formatting
  const isDatabaseData = data && data.tenantUsage?.range?.values?.some((item: any) => 'totalBytes' in item)
  const isCloudinaryData = data && data.tenantUsage?.range?.values?.some((item: any) => 'storageBytes' in item)
  const useGBFormatting = isDatabaseData || isCloudinaryData

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: useGBFormatting ? {
          label: function(context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(4) + ' GB'
            }
            return label
          }
        } : undefined,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
        },
        ticks: useGBFormatting ? {
          callback: function(value: any) {
            return value.toFixed(4) + ' GB'
          }
        } : undefined,
      },
    },
  }

  return (
    <div className="chart-wrapper">
      {isLoading ? (
        <div className="loading-spinner">
          <div>Loading...</div>
        </div>
      ) : (
        <Chart type="bar" data={createChartData()} options={chartOptions} />
      )}
    </div>
  )
}

export default StatisticsChart 