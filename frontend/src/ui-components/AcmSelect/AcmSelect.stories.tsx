/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption } from '@patternfly/react-core'
import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmSelect } from './AcmSelect'
import { SelectVariant } from '../../components/AcmSelectBase'

export default {
  title: 'Select',
  component: AcmSelect,
}

export const Select = () => {
  const [value, setValue] = useState<string>()

  return (
    <AcmForm>
      <AcmSelect label="Select" placeholder="options" id="select" value={value} onChange={setValue}>
        <SelectOption key="option-1" value="option-1">
          Option 1
        </SelectOption>
        <SelectOption key="option-2" value="option-2">
          Option 2
        </SelectOption>
        <SelectOption key="option-3" value="option-3">
          Option 3
        </SelectOption>
      </AcmSelect>
    </AcmForm>
  )
}

export const TypeAheadSelect = () => {
  const [value, setValue] = useState<string>()
  return (
    <AcmForm>
      <AcmSelect
        label="Select"
        id="select"
        value={value}
        onChange={setValue}
        placeholder="options"
        variant={SelectVariant.typeahead}
      >
        <SelectOption key="option-1" value="option-1">
          Option 1
        </SelectOption>
        <SelectOption key="option-2" value="option-2">
          Option 2
        </SelectOption>
        <SelectOption key="option-3" value="option-3">
          Option 3
        </SelectOption>
      </AcmSelect>
    </AcmForm>
  )
}
