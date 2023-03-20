/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmKubernetesLabelsInput } from './AcmLabelsInput'

export default {
  title: 'LabelsInput',
  component: AcmKubernetesLabelsInput,
  argTypes: {
    isDisabled: { control: 'boolean' },
  },
}

export const LabelsInput = (args: any) => {
  const [value, setValue] = useState<Record<string, string> | undefined>({})
  return (
    <AcmPageCard>
      <AcmForm>
        <AcmKubernetesLabelsInput
          label="Labels Input"
          id="labels-input"
          isDisabled={args.isDisabled}
          value={value}
          onChange={setValue}
          placeholder="Enter key=value, then press enter, space, or comma"
        />
      </AcmForm>
    </AcmPageCard>
  )
}
LabelsInput.args = { isDisabled: false }
