export const nextRequestId = (currentId: number): number => currentId + 1

export const isLatestRequest = (
  currentId: number,
  requestId: number
): boolean => currentId === requestId
