import React from 'react'
import { Skeleton } from 'primereact/skeleton'
import { StylableProps } from '../helpers/props'

const TabsLoader = (props: StylableProps) => {
  const { className = '' } = props

  return (
    <Skeleton className={className} width="3.5rem" height="1rem"></Skeleton>
  )
}

export default TabsLoader
