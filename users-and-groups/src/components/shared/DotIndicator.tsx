export interface DotIndicatorProps {
  value: boolean
  className?: string
  color?: string
}

const dotStyles = (value: boolean, color?: string) => {
  return {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: value ? (color ? color : '#10C929FF') : '#7B8B99FF',
  }
}

export const DotIndicator = (props: DotIndicatorProps) => {
  return (
    <div
      data-test-id="dot-indicator"
      className={props.className ?? ''}
      style={dotStyles(props.value, props.color)}
    ></div>
  )
}
