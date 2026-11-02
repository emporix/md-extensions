type RichFrameDownloadProps = {
  readonly label: string
  readonly disabled: boolean
  readonly onClick: () => void
}

export const RichFrameDownload = ({
  label,
  disabled,
  onClick,
}: RichFrameDownloadProps) => (
  <button
    type="button"
    className="rich-frame-download"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation()
      onClick()
    }}
  >
    <i className="pi pi-download" aria-hidden="true" />
  </button>
)
