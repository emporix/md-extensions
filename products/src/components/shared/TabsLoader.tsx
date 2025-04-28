import { Skeleton } from 'primereact'

interface TabsSpinnerProps {
  className: string
}

const TabsLoader = (props: TabsSpinnerProps) => {
  return (
    <Skeleton
      className={props.className}
      width="3.5rem"
      height="1rem"
    ></Skeleton>
  )
}

TabsLoader.defaultProps = {
  className: '',
}

export default TabsLoader
