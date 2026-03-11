import { ISO2_TO_MAP_ID } from '../data/iso2ToMapId'

export type CountryCounts = {
  orders: number
  quotes: number
}

export const getFlagEmoji = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return ''
  return iso2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join('')
}

export const getCountsByMapId = (
  ordersByCountry: Map<string, number>,
  quotesByCountry: Map<string, number>
): Map<string, CountryCounts> => {
  const map = new Map<string, CountryCounts>()
  const allIso2 = new Set([
    ...ordersByCountry.keys(),
    ...quotesByCountry.keys(),
  ])

  allIso2.forEach((iso2) => {
    const mapId = ISO2_TO_MAP_ID[iso2]
    if (!mapId) return

    map.set(mapId, {
      orders: ordersByCountry.get(iso2) ?? 0,
      quotes: quotesByCountry.get(iso2) ?? 0,
    })
  })

  return map
}

export const getMapIdToIso2 = (): Record<string, string> => {
  const out: Record<string, string> = {}
  Object.entries(ISO2_TO_MAP_ID).forEach(([iso2, id]) => {
    out[id] = iso2
  })
  return out
}
