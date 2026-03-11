import { useMemo, useState, useCallback, useRef } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useLastOrders } from '../../hooks/useLastOrders'
import { useLastQuotes } from '../../hooks/useLastQuotes'
import { getOrdersByCountry } from '../../helpers/order.helpers'
import { getQuotesByCountry } from '../../helpers/quote.helpers'
import {
  getCountsByMapId,
  getFlagEmoji,
  getMapIdToIso2,
} from '../../helpers/geo.helpers'
import styles from './OrdersByCountryMapWidget.module.scss'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const DEFAULT_FILL = '#e5e7eb'
const COUNTRY_WITH_ACTIVITY_FILL = 'var(--color-primary, #3b82f6)'
const COUNTRY_STROKE = '#cbd5e1'

const MAP_ID_TO_ISO2 = getMapIdToIso2()

export const OrdersByCountryMapWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useLastOrders(appState?.tenant, appState?.token, site?.code)
  const {
    quotes,
    loading: quotesLoading,
    error: quotesError,
  } = useLastQuotes(appState?.tenant, appState?.token, site?.code)

  const ordersByCountry = useMemo(() => getOrdersByCountry(orders), [orders])
  const quotesByCountry = useMemo(() => getQuotesByCountry(quotes), [quotes])

  const countsByMapId = useMemo(
    () => getCountsByMapId(ordersByCountry, quotesByCountry),
    [ordersByCountry, quotesByCountry]
  )

  const mapWrapRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    iso2: string
    orders: number
    quotes: number
    x: number
    y: number
  } | null>(null)

  const handleMouseEnter = useCallback(
    (evt: React.MouseEvent<SVGPathElement>, mapId: string) => {
      const iso2 = MAP_ID_TO_ISO2[mapId]
      if (!iso2) return
      const counts = countsByMapId.get(mapId) ?? { orders: 0, quotes: 0 }
      const wrap = mapWrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      setTooltip({
        iso2,
        orders: counts.orders,
        quotes: counts.quotes,
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
      })
    },
    [countsByMapId]
  )

  const handleMouseMove = useCallback(
    (evt: React.MouseEvent<SVGPathElement>, mapId: string) => {
      if (!tooltip || tooltip.iso2 !== MAP_ID_TO_ISO2[mapId]) return
      const wrap = mapWrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      setTooltip((prev) =>
        prev
          ? { ...prev, x: evt.clientX - rect.left, y: evt.clientY - rect.top }
          : null
      )
    },
    [tooltip]
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const loading = ordersLoading || quotesLoading
  const error = ordersError ?? quotesError ?? null
  const showMap = !loading && !error

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>{t('map.title')}</h3>

      {loading && (
        <div className={styles.placeholder}>
          <span>{t('charts.loading')}</span>
        </div>
      )}

      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{t(error)}</span>
        </div>
      )}

      {showMap && (
        <>
          <div ref={mapWrapRef} className={styles.mapWrap}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                center: [15, 50],
                scale: 500,
              }}
              className={styles.map}
            >
              <Geographies geography={GEO_URL}>
                {({
                  geographies,
                }: {
                  geographies: Array<{ rsmKey: string; id?: string }>
                }) =>
                  geographies.map((geo: { rsmKey: string; id?: string }) => {
                    const id = geo.id ?? ''
                    const counts = countsByMapId.get(id)
                    const total = counts ? counts.orders + counts.quotes : 0
                    const fill =
                      total > 0 ? COUNTRY_WITH_ACTIVITY_FILL : DEFAULT_FILL
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={COUNTRY_STROKE}
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', opacity: 0.9 },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={(evt: React.MouseEvent<SVGPathElement>) =>
                          handleMouseEnter(
                            evt as React.MouseEvent<SVGPathElement>,
                            id
                          )
                        }
                        onMouseMove={(evt: React.MouseEvent<SVGPathElement>) =>
                          handleMouseMove(
                            evt as React.MouseEvent<SVGPathElement>,
                            id
                          )
                        }
                        onMouseLeave={handleMouseLeave}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>
            {tooltip && (
              <div
                className={styles.tooltip}
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y + 8,
                }}
                role="tooltip"
              >
                <span className={styles.tooltipFlag} aria-hidden>
                  {getFlagEmoji(tooltip.iso2)}
                </span>
                <div className={styles.tooltipText}>
                  <strong>{tooltip.iso2}</strong>
                  <span className={styles.tooltipLine}>
                    {tooltip.orders === 1
                      ? `1 ${t('map.order')}`
                      : t('map.orders').replace(
                          '{count}',
                          String(tooltip.orders)
                        )}
                  </span>
                  <span className={styles.tooltipLine}>
                    {tooltip.quotes === 1
                      ? `1 ${t('map.quote')}`
                      : t('map.quotes').replace(
                          '{count}',
                          String(tooltip.quotes)
                        )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
