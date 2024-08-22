/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmTextInput } from './AcmTextInput'

export default {
  title: 'TextInput',
  component: AcmTextInput,
}

export const TextInput = () => {
  const [value, setValue] = useState<string>()

  return (
    <AcmForm>
      <AcmTextInput label="Label" id="123" value={value} onChange={(_event, value) => setValue(value)} />
    </AcmForm>
  )
}
