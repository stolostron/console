/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmLabelsInput, addLabelRecord, getLabelStringFromRecord, removeLabelRecord } from './AcmLabelsInput'

export default {
  title: 'LabelsInput',
  component: AcmLabelsInput,
  argTypes: {
    isDisabled: { control: 'boolean' },
  },
}

export const LabelsInput = (args: any) => {
  const [value, setValue] = useState<Record<string, string> | undefined>({})
  return (
    <AcmPageCard>
      <AcmForm>
        <AcmLabelsInput
          label="Labels Input"
          id="labels-input"
          isDisabled={args.isDisabled}
          value={value}
          onChange={setValue}
          addLabel={addLabelRecord}
          removeLabel={removeLabelRecord}
          getLabelString={getLabelStringFromRecord}
          buttonLabel="Add label"
          placeholder="Enter key=value, then press enter, space, or comma"
        />
      </AcmForm>
    </AcmPageCard>
  )
}
LabelsInput.args = { isDisabled: false }
