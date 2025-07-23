import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Chart } from 'react-chartjs-2'
import { ApiCallsExpandedStatisticsResponse, TimeUnit } from '../models/Statistics.model'
import { MultiSelect } from 'primereact/multiselect'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ApiProxyChartProps {
  data: ApiCallsExpandedStatisticsResponse | null
  timeUnit: TimeUnit
  isLoading: boolean
}

const proxyNameMap: Record<string, string> = {
  'cop-bff': 'orchestration-engine',
  'cxp-bff': 'orchestration-engine',
  'copb-api': 'orchestration-engine',
  'caas-product': 'product',
  'caas-cart': 'cart',
  'caas-site': 'site',
  'caas-category': 'category',
  'caas-indexing-service': 'indexing-service',
  'caas-customer': 'customer',
  'caas-order': 'order',
}

const ApiProxyChart: React.FC<ApiProxyChartProps> = ({ data, timeUnit, isLoading }) => {
  const chartRef = useRef<any>(null)
  const [selectedProxies, setSelectedProxies] = useState<string[]>([])
  const hasInitialized = useRef(false)

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const { chartData, allProxies } = useMemo(() => {
    if (!data || !data.tenantUsage?.range?.values) {
      return {
        chartData: { labels: [], datasets: [] },
        allProxies: []
      }
    }

    const proxyDataByDate = new Map<string, Map<string, number>>()
    const proxiesSet = new Set<string>()

    data.tenantUsage.range.values.forEach(item => {
      if (item.requestsCount > 0) {
        if (!proxyDataByDate.has(item.date)) {
          proxyDataByDate.set(item.date, new Map())
        }
        // Apply proxy name mapping
        const originalProxy = item.apiproxy || 'unknown'
        const proxy = proxyNameMap[originalProxy] || originalProxy
        proxiesSet.add(proxy)
        const dateMap = proxyDataByDate.get(item.date)!
        const currentCount = dateMap.get(proxy) || 0
        dateMap.set(proxy, currentCount + item.requestsCount)
      }
    })

    const sortedDates = Array.from(proxyDataByDate.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    )

    const labels = sortedDates.map(date => {
      const dateObj = new Date(date)
      if (timeUnit === 'day') {
        return dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      } else if (timeUnit === 'week') {
        return `Week ${getWeekNumber(dateObj)}`
      } else {
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    })

    const proxiesSortedByValue: string[] = (() => {
      const proxyTotals: Record<string, number> = {}
      sortedDates.forEach(date => {
        const dateMap = proxyDataByDate.get(date) || new Map()
        dateMap.forEach((count, proxy) => {
          proxyTotals[proxy] = (proxyTotals[proxy] || 0) + count
        })
      })
      return Object.entries(proxyTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([proxy]) => proxy)
    })()

    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
      '#ec4899', '#6366f1', '#14b8a6', '#fbbf24', '#a855f7', '#0ea5e9', '#65a30d', '#ea580c',
      '#e11d48', '#7c3aed', '#059669', '#d97706', '#c026d3', '#0284c7', '#16a34a', '#dc2626',
      '#7c2d12', '#92400e', '#b45309', '#a16207', '#4d7c0f', '#166534', '#064e3b', '#134e4a'
    ]

    const datasets = proxiesSortedByValue
      .filter(proxy => selectedProxies.includes(proxy))
      .map((proxy, index) => ({
        label: proxy,
        data: sortedDates.map(date => {
          const dateMap = proxyDataByDate.get(date)
          return dateMap?.get(proxy) || 0
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1,
      }))

    return {
      chartData: { labels, datasets },
      allProxies: proxiesSortedByValue
    }
  }, [data, timeUnit, selectedProxies])

  // Set all proxies as selected by default when data changes
  useEffect(() => {
    if (!hasInitialized.current && allProxies.length > 0) {
      setSelectedProxies(allProxies)
      hasInitialized.current = true
    }
  }, [allProxies])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11
          }
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        itemSort: (a: any, b: any) => b.raw - a.raw, // Sort tooltip items descending
        callbacks: {
          footer: (tooltipItems: any[]) => {
            const total = tooltipItems.reduce((sum, item) => sum + item.raw, 0)
            return `Total: ${total.toLocaleString()}`
          }
        }
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString()
          }
        }
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }

  if (isLoading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading advanced data...</div>
      </div>
    )
  }

  return (
    <div style={{ height: '400px', marginTop: '1rem' }}>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.95rem', color: '#374151' }}>Proxies:</span>
        <MultiSelect
          value={selectedProxies}
          options={allProxies.map(proxy => ({ label: proxy, value: proxy }))}
          onChange={e => setSelectedProxies(e.value)}
          placeholder="Select proxies"
          display="chip"
          style={{ minWidth: '220px', fontSize: '0.95rem' }}
          maxSelectedLabels={3}
        />
      </div>
      <Chart ref={chartRef} type="bar" data={chartData} options={chartOptions} />
    </div>
  )
}

export default ApiProxyChart 