/* Copyright Contributors to the Open Cluster Management project */

import { SelectProps } from '@patternfly/react-core/deprecated'
import { ReactNode } from 'react'
import { AcmSelect, SelectVariant } from '../AcmSelect'

type AcmMultiSelectProps = Pick<
  SelectProps,
  Exclude<keyof SelectProps, 'onToggle' | 'onChange' | 'selections' | 'onSelect' | 'variant'>
> & {
  id: string
  label: string
  variant?: SelectVariant.checkboxMulti | SelectVariant.typeaheadMulti
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
  validation?: (value: string | undefined) => string | undefined
  placeholder?: string
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
  isRequired?: boolean
  isLoading?: boolean
  maxHeight?: string
  menuAppendTo?: string
}

export function AcmMultiSelect(props: AcmMultiSelectProps) {
  const { onChange, value, variant, ...selectProps } = props

  return (
    <AcmSelect
      variant={!variant ? SelectVariant.checkboxMulti : variant}
      values={value}
      onChanges={onChange}
      {...selectProps}
    />
  )
}
