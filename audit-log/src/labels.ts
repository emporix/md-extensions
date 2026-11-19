export type ChangelogChangeTypeKey = 'created' | 'updated' | 'deleted'

export type EntityChangelogLabels = {
  readonly empty: string
  readonly loadError: string
  readonly retry: string
  readonly notSet: string
  readonly fieldColumn: string
  readonly previousValueColumn: string
  readonly updatedValueColumn: string
  readonly windowLabel: string
  readonly windowLimitHint: string
  readonly previousPage: string
  readonly nextPage: string
  readonly changeType: (key: ChangelogChangeTypeKey) => string
  readonly entity: (entity: string) => string
}
