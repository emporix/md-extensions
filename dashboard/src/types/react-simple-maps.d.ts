declare module 'react-simple-maps' {
  import type { ReactNode, MouseEvent } from 'react'

  type Geography = {
    rsmKey: string
    id?: string
    svgPath?: string
    [key: string]: unknown
  }

  type GeographyProps = {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: Record<string, Record<string, unknown>>
    onMouseEnter?: (evt: MouseEvent<SVGPathElement>) => void
    onMouseMove?: (evt: MouseEvent<SVGPathElement>) => void
    onMouseLeave?: () => void
  }

  export const ComposableMap: (props: {
    projection?: string
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
      parallels?: [number, number]
    }
    className?: string
    children?: ReactNode
  }) => JSX.Element

  export const Geographies: (props: {
    geography: string | object
    children: (props: { geographies: Geography[] }) => ReactNode
  }) => JSX.Element

  export const Geography: (props: GeographyProps) => JSX.Element
}
