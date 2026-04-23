import React from 'react'
import { MixinsFormTemplate } from 'components/mixins/helpers'

interface Props {
  form: MixinsFormTemplate
}

const MixinsTabTitle = (props: Props) => {
  const { form } = props
  return (
    <>
      {form.newerVersion ? (
        <div style={{ position: 'relative' }}>
          <span>{form.name}</span>
          <span
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-16px',
              fontSize: '0.75em',
              backgroundColor: '#f39c12',
              color: 'white',
              borderRadius: '2px',
              minWidth: '16px',
              width: 'fit-content',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'translate(0, 50%)',
              padding: '0 2px',
            }}
          >
            v{form.newerVersion}
          </span>
        </div>
      ) : (
        form.name
      )}
    </>
  )
}

export default MixinsTabTitle
