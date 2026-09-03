import type { AppState } from '../types/common'
import {
  downloadMediaAssetZip,
  getFunctionDeployments,
} from '../services/hostingFunctionsService'
import { getLatestDeploymentMediaId } from './functionDeploymentMedia.helpers'
import {
  type FunctionZipSourceFile,
  loadFunctionZipSourceFiles,
} from './functionZipSource.helpers'

export const MCP_TOOL_FROM_FUNCTION_ZIP_I18N_KEYS = {
  noFunction: 'mcp_tool_from_function_no_function',
  noMedia: 'mcp_tool_from_function_no_media',
  noSource: 'mcp_tool_from_function_no_source',
} as const

export type FunctionZipLoadI18nKeys = {
  readonly noFunction: string
  readonly noMedia: string
  readonly noSource: string
}

export const loadLatestFunctionZipSourceFiles = async (
  appState: AppState,
  functionId: string,
  i18nKeys: FunctionZipLoadI18nKeys
): Promise<FunctionZipSourceFile[]> => {
  const trimmedFunctionId = functionId.trim()
  if (!trimmedFunctionId) {
    throw new Error(i18nKeys.noFunction)
  }

  const { deployments } = await getFunctionDeployments(
    appState,
    trimmedFunctionId
  )
  const mediaId = getLatestDeploymentMediaId(deployments)
  if (!mediaId) {
    throw new Error(i18nKeys.noMedia)
  }

  const zipBuffer = await downloadMediaAssetZip(appState, mediaId)
  const sourceFiles = await loadFunctionZipSourceFiles(zipBuffer)
  if (sourceFiles.length === 0) {
    throw new Error(i18nKeys.noSource)
  }

  return sourceFiles
}

export const isFunctionZipI18nErrorKey = (
  message: string,
  keys: FunctionZipLoadI18nKeys
): boolean =>
  message === keys.noFunction ||
  message === keys.noMedia ||
  message === keys.noSource
