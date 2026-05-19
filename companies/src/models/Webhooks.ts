export interface EventSchema {
  id: string
  name: string
  description: string
  productType: string
}

export interface Name {
  en: string
}

export interface Group {
  en: string
}

export interface Description {
  en: string
}

export interface Event {
  type: string
  eventSchema: EventSchema
  name: Name
  group: Group
  description: Description
  metadata?: Metadata
  fieldsToSubscribe?: string[]
  fieldsToUnsubscribe?: string[]
}

export interface Metadata {
  version: number
  createdAt: string
  modifiedAt: string
}

export enum SubscriptionStatus {
  SUBSCRIBED = 'SUBSCRIBED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}
export enum SubscriptionAction {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
}

export interface Subscription {
  event: Event
  metadata: Metadata
  subscription: SubscriptionStatus
  group: string
  excludedFields: string[]
}

export interface GroupedSubscriptions {
  group: string
  subscriptions: Subscription[]
}

export interface DayStatistic {
  statisticsMonth: string
  succesfullySentWebhooks: number
}

export interface WebhooksStatistics {
  webhooksLimit: number
  monthStatistics: DayStatistic[]
}

export interface WebhooksDateRange {
  fromYearMonth: string
  toYearMonth: string
}

export interface EventFieldsToModify {
  fieldsToSubscribe?: string[]
  fieldsToUnsubscribe?: string[]
}

export enum Provider {
  HTTP = 'HTTP',
  SVIX = 'SVIX',
  SVIX_SHARED = 'SVIX_SHARED',
}

export interface HttpHeaderValue {
  value: string
}

export interface HttpHeaders {
  [key: string]: HttpHeaderValue
}

export interface EventConfiguration {
  eventType: string
  destinationUrl: string | undefined
  headers: HttpHeaders | undefined
  secretKeyExists: boolean
}

export interface HttpConfiguration {
  destinationUrl: string
  secretKeyExists: boolean
  eventsConfiguration: EventConfiguration[] | undefined
  headers: HttpHeaders | undefined
}

export interface Config {
  code: string
  active: boolean
  provider: Provider
  configuration: HttpConfiguration | undefined
}

export interface EventConfigurationPayload {
  eventType: string
  destinationUrl: string
  secretKey: string | undefined
}

export interface HttpConfigurationPayload {
  destinationUrl: string
  secretKey: string | undefined
  eventsConfiguration: EventConfigurationPayload[] | undefined
}

export interface SvixConfigurationPayload {
  apiKey: string
}

export interface ConfigPayload {
  code: string
  active: boolean
  provider: Provider
  configuration: HttpConfigurationPayload | SvixConfigurationPayload | undefined
}

export interface ConfigCreationResponse {
  code: string
}

export enum Operation {
  UPSERT = 'UPSERT',
  REMOVE = 'REMOVE',
}

export class Path {
  static readonly ACTIVE = '/active'
  static readonly CONFIGURATION = '/configuration'
  static readonly CONFIGURATION_SVIX_API_KEY = '/configuration/svix/apiKey'
  static readonly CONFIGURATION_HTTP_HEADERS = '/configuration/http/headers'
  static readonly CONFIGURATION_HTTP_DESTINATION_URL =
    '/configuration/http/destinationUrl'
  static readonly CONFIGURATION_HTTP_SECRET_KEY =
    '/configuration/http/secretKey'
  static readonly CONFIGURATION_HTTP_EVENTS_CONFIGURATION =
    '/configuration/http/eventsConfiguration'

  static CONFIGURATION_HTTP_EVENTS_CONFIGURATION_EVENT(eventType: string) {
    return '/configuration/http/eventsConfiguration/' + eventType
  }

  static CONFIGURATION_HTTP_EVENTS_CONFIGURATION_EVENT_SECRET_KEY(
    eventType: string
  ) {
    return '/configuration/http/eventsConfiguration/' + eventType + '/secretKey'
  }

  static CONFIGURATION_HTTP_EVENTS_CONFIGURATION_EVENT_DESTINATION_URL(
    eventType: string
  ) {
    return (
      '/configuration/http/eventsConfiguration/' + eventType + '/destinationUrl'
    )
  }

  static CONFIGURATION_HTTP_EVENTS_CONFIGURATION_EVENT_HEADERS(
    eventType: string
  ) {
    return '/configuration/http/eventsConfiguration/' + eventType + '/headers'
  }
}

export interface ConfigPatch {
  op: Operation
  path: string
  value:
    | SvixConfigurationPayload
    | HttpConfigurationPayload
    | EventConfigurationPayload
    | EventConfigurationPayload[]
    | HttpHeaders
    | string
    | boolean
    | undefined
}
