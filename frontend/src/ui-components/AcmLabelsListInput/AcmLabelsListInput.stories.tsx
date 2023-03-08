/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmLabelsListInput } from './AcmLabelsListInput'

export default {
  title: 'LabelListInput',
  component: AcmLabelsListInput,
  argTypes: {
    isDisabled: { control: 'boolean' },
  },
}

export const LabelListInput = (args: any) => {
  const [value, setValue] = useState<string | undefined>()
  return (
    <AcmPageCard>
      <AcmForm>
        <AcmLabelsListInput
          label="Tag Input"
          id="tag-input"
          isDisabled={args.isDisabled}
          value={value}
          onChange={(input) => {
            setValue(input?.join(','))
          }}
          buttonLabel="Add label"
          placeholder="Enter tag value, then press enter, or comma"
        />
      </AcmForm>
    </AcmPageCard>
  )
}
LabelListInput.args = { isDisabled: false }
