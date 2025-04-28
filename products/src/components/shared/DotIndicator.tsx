export interface DotIndicatorProps {
  value: boolean
  className?: string
  color?: string
}

const dotStyles = (value: boolean, color?: string) => {
  return {
    width: '12px',
    height: '12px',
    backgroundColor: value ? (color ? color : '#10C929FF') : '#7B8B99FF',
  }
}

export const DotIndicator = (props: DotIndicatorProps) => {
  return (
    <div
      data-test-id="dot-indicator"
      className={`${props.className} border-round`}
      style={dotStyles(props.value, props.color)}
    ></div>
  )
}
