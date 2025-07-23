import MultiTenantStatisticsTab from '../components/MultiTenantStatisticsTab'
import AiStatisticsTab from '../components/tabs/AiStatisticsTab'
import ApiCallsView from '../views/ApiCallsView'
import MakeView from '../views/MakeView'
import DatabaseView from '../views/DatabaseView'
import CloudinaryView from '../views/CloudinaryView'
import WebhooksView from '../views/WebhooksView'

export type DataKey = 'statisticsData' | 'makeStatisticsData' | 'databaseStatisticsData' | 'cloudinaryStatisticsData' | 'webhooksStatisticsData';
export type SummaryKey = 'summary' | 'makeSummary' | 'databaseSummary' | 'cloudinarySummary' | 'webhooksSummary';
export type AggregatedDataKey = 'getAggregatedApiCallsData' | 'getAggregatedMakeData' | 'getAggregatedDatabaseData' | 'getAggregatedCloudinaryData' | 'getAggregatedWebhooksData';
export type CsvHandlerKey = 'handleDownloadApiCallsCSV' | 'handleDownloadMakeCSV' | 'handleDownloadDatabaseCSV' | 'handleDownloadCloudinaryCSV' | 'handleDownloadWebhooksCSV';

export interface StatisticsTabConfig {
  key: string
  labelKey: string
  Component: any
  dataKey?: DataKey
  summaryKey?: SummaryKey
  getAggregatedDataKey?: AggregatedDataKey
  View?: any
  csvHandlerKey?: CsvHandlerKey
  isAi?: boolean
}

export const tabConfigs: StatisticsTabConfig[] = [
  {
    key: 'apiCalls',
    labelKey: 'apiCalls',
    Component: MultiTenantStatisticsTab,
    dataKey: 'statisticsData',
    summaryKey: 'summary',
    getAggregatedDataKey: 'getAggregatedApiCallsData',
    View: ApiCallsView,
    csvHandlerKey: 'handleDownloadApiCallsCSV',
  },
  {
    key: 'make',
    labelKey: 'make',
    Component: MultiTenantStatisticsTab,
    dataKey: 'makeStatisticsData',
    summaryKey: 'makeSummary',
    getAggregatedDataKey: 'getAggregatedMakeData',
    View: MakeView,
    csvHandlerKey: 'handleDownloadMakeCSV',
  },
  {
    key: 'database',
    labelKey: 'database',
    Component: MultiTenantStatisticsTab,
    dataKey: 'databaseStatisticsData',
    summaryKey: 'databaseSummary',
    getAggregatedDataKey: 'getAggregatedDatabaseData',
    View: DatabaseView,
    csvHandlerKey: 'handleDownloadDatabaseCSV',
  },
  {
    key: 'cloudinary',
    labelKey: 'cloudinary',
    Component: MultiTenantStatisticsTab,
    dataKey: 'cloudinaryStatisticsData',
    summaryKey: 'cloudinarySummary',
    getAggregatedDataKey: 'getAggregatedCloudinaryData',
    View: CloudinaryView,
    csvHandlerKey: 'handleDownloadCloudinaryCSV',
  },
  {
    key: 'ai',
    labelKey: 'ai',
    Component: AiStatisticsTab,
    isAi: true,
  },
  {
    key: 'webhooks',
    labelKey: 'webhooks',
    Component: MultiTenantStatisticsTab,
    dataKey: 'webhooksStatisticsData',
    summaryKey: 'webhooksSummary',
    getAggregatedDataKey: 'getAggregatedWebhooksData',
    View: WebhooksView,
    csvHandlerKey: 'handleDownloadWebhooksCSV',
  },
] 