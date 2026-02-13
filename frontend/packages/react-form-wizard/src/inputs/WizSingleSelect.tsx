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
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])

  const onSelect = useCallback(
    (selectedString: string | undefined) => {
      setValue(selectedString)
      setOpen(false)
    },
    [setValue]
  )

  const handleSetOptions = useCallback(
    (o: string[]) => {
      if (o.length > 0) {
        const filtered =
          options?.filter((option) => {
            return o.includes(option)
          }) ?? []
        if (value !== '') {
          const valueAsString = String(value)
          // Check if value already exists in filtered to avoid duplicates
          const valueExists = options?.some((op) => op === valueAsString)
          if (!valueExists) {
            filtered.unshift(value)
          }
        }
        setFilteredOptions([...filtered, ...o])
      } else {
        setFilteredOptions([noResults])
      }
    },
    [noResults, options, value]
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
                if (!isOpen) {
                  setOpen(false)
                }
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <InputSelect
                  disabled={disabled || readonly}
                  validated={validated}
                  placeholder={placeholder}
                  required={required}
                  options={options}
                  setOptions={handleSetOptions}
                  isCreatable={isCreatable}
                  toggleRef={toggleRef}
                  value={value}
                  onSelect={onSelect}
                  open={open}
                  setOpen={setOpen}
                />
              )}
              selected={value}
              onSelect={(_event, value) => onSelect(value?.toString() ?? '')}
              isScrollable
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
