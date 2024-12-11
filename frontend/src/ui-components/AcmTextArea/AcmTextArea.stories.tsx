/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmTextArea } from './AcmTextArea'

export default {
  title: 'TextArea',
  component: AcmTextArea,
}

export const TextArea = () => {
  const [value, setValue] = useState<string>()

  return (
    <AcmForm>
      <AcmTextArea label="Label" id="123" value={value} onChange={(_event, value) => setValue(value)} />
    </AcmForm>
  )
}
