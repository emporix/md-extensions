export interface Extension {
  id: string
  url: string
  name: { en: string; de: string }
  isModule: boolean
  moduleName?: string
}
