import { Button } from 'primereact/button'

export interface Option {
  id: string
  image: string
  name: string
}

interface Props {
  data: Option
  onDeleteCall: (id: string) => unknown
}

const LabelChip = ({ data, onDeleteCall }: Props) => {
  return (
    <div className="col-3 flex shadow-1 w-16rem h-3rem mb-4 align-items-center m-2">
      <div className="mr-2 ml-2">
        <img src={data.image} />
      </div>
      <span className="flex-grow-1">{data.name}</span>
      <Button
        icon="pi-times pi"
        onClick={(e) => {
          e.preventDefault()
          onDeleteCall(data.id)
        }}
        className="p-button-text mr-2"
      />
    </div>
  )
}

export default LabelChip
