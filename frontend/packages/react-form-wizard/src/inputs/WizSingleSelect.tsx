/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  InputGroup,
  InputGroupItem,
  MenuToggleElement,
  Select as PfSelect,
} from '@patternfly/react-core'
import { ReactNode, useCallback, useState } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { getSelectPlaceholder, InputCommonProps, useInput } from './Input'
import { InputSelect, SelectListOptions } from './InputSelect'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

export type WizSingleSelectProps = InputCommonProps<string> & {
  label: string
  placeholder?: string
  isCreatable?: boolean
  footer?: ReactNode
  options: string[]
}

export function WizSingleSelect(props: WizSingleSelectProps) {
  const { displayMode: mode, value, setValue, validated, hidden, id, disabled, required } = useInput(props)
  const { noResults } = useStringContext()
  const { label, readonly, isCreatable, options, footer } = props
  const placeholder = getSelectPlaceholder(props)
  const [open, setOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<string>(value || '')
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])

  const onSelect = useCallback(
    (selectedString: string | undefined) => {
      setValue(selectedString)
      setFilterValue('')
      setOpen(false)
    },
    [setValue]
  )

  const handleSetOptions = useCallback(
    (o: string[]) => {
      if (o.length > 0) {
        setFilteredOptions(o)
      } else {
        setFilteredOptions([noResults])
      }
    },
    [noResults]
  )

  if (hidden) return null

  if (mode === DisplayMode.Details) {
    if (!value) return null
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{label}</DescriptionListTerm>
        <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  return (
    <div id={id}>
      <WizFormGroup {...props} id={id}>
        <InputGroup>
          <InputGroupItem isFill>
            <PfSelect
              isOpen={open}
              onOpenChange={(isOpen) => {
                !isOpen && setOpen(false)
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <InputSelect
                  disabled={disabled || readonly}
                  validated={validated}
                  placeholder={placeholder}
                  required={required}
                  options={options}
                  setOptions={handleSetOptions}
                  toggleRef={toggleRef}
                  value={value}
                  filterValue={filterValue}
                  setFilterValue={setFilterValue}
                  onSelect={onSelect}
                  open={open}
                  setOpen={setOpen}
                />
              )}
              selected={value}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              onSelect={(_event, value) => onSelect(value?.toString() ?? '')}
            >
              <SelectListOptions
                value={value}
                allOptions={options}
                filteredOptions={filteredOptions}
                isCreatable={isCreatable}
                footer={footer}
              />
            </PfSelect>
          </InputGroupItem>
        </InputGroup>
      </WizFormGroup>
    </div>
  )
}
