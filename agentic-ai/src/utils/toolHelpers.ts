import { Tool } from '../types/Tool'

export const createEmptyTool = (): Tool => ({
  id: '',
  name: '',
  type: 'slack',
  config: {},
  enabled: true,
})
