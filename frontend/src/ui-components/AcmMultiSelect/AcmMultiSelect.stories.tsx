/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption } from '@patternfly/react-core'
import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmMultiSelect } from './AcmMultiSelect'

export default {
  title: 'MultiSelect',
  component: AcmMultiSelect,
}

export const MultiSelect = () => {
  const [value, setValue] = useState<string[]>()

  return (
    <AcmForm>
      <AcmMultiSelect label="MultiSelect" id="multiselect" value={value} onChange={setValue}>
        <SelectOption key="option-1" value="option-1">
          Option 1
        </SelectOption>
        <SelectOption key="option-2" value="option-2">
          Option 2
        </SelectOption>
        <SelectOption key="option-3" value="option-3">
          Option 3
        </SelectOption>
      </AcmMultiSelect>
    </AcmForm>
  )
}
