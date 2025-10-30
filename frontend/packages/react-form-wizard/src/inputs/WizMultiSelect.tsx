/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  MenuToggleElement,
  Select as PfSelect,
} from '@patternfly/react-core'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { getSelectPlaceholder, InputCommonProps, useInput } from './Input'
import { InputSelect, SelectListOptions } from './InputSelect'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

export type WizMultiSelectProps = InputCommonProps<string[]> & {
  placeholder?: string
  footer?: ReactNode
  label: string
  isCreatable?: boolean
  options: string[]
}

export function WizMultiSelect(props: WizMultiSelectProps) {
  const { displayMode: mode, value, setValue, validated, hidden, id, disabled } = useInput(props)
  const { noResults } = useStringContext()
  const { isCreatable, options, footer } = props
  const placeholder = getSelectPlaceholder(props)
  const [open, setOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])

  const allOptions = useMemo(() => {
    // If resource (value) contains values not available in props.options - they should be included in order to deselect from dropdown.
    let allOptions = [...options, ...(value || [])]
    // Create a new Set from the array - Sets only store unique values.
    const uniqueSet = new Set(allOptions)
    return [...uniqueSet]
  }, [options, value])

  const handleSetOptions = useCallback((o: string[]) => {
    if (o.length > 0) {
      setFilteredOptions(o)
    } else {
      setFilteredOptions([noResults])
    }
  }, [])

  const onSelect = useCallback(
    (selectedString: string | undefined) => {
      if (!selectedString) {
        setValue([])
        return
      }

      let newValues: any[]
      if (Array.isArray(value)) newValues = [...value]
      else newValues = []
      if (newValues.includes(selectedString)) {
        newValues = newValues.filter((value) => value !== selectedString)
      } else {
        newValues.push(selectedString)
      }
      setValue(newValues)
    },
    [setValue, value]
  )

  if (hidden) return null

  if (mode === DisplayMode.Details) {
    if (!value) return null
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{props.label}</DescriptionListTerm>
        <DescriptionListDescription id={id}>
          {value.length > 5 ? (
            `${value.length as string} selected`
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
              {(value as string[]).map((selection, index) => (
                <div key={index}>{selection}</div>
              ))}
            </div>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  return (
    <div id={id}>
      <WizFormGroup {...props}>
        <PfSelect
          onOpenChange={(isOpen) => {
            !isOpen && setOpen(false)
          }}
          isOpen={open}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <InputSelect
              disabled={disabled}
              validated={validated}
              placeholder={placeholder}
              options={allOptions}
              setOptions={handleSetOptions}
              toggleRef={toggleRef}
              value={value}
              onSelect={onSelect}
              open={open}
              setOpen={setOpen}
            />
          )}
          selected={value}
          onSelect={(_event, value) => onSelect(value?.toString() ?? '')}
        >
          <SelectListOptions
            value={value}
            options={filteredOptions}
            isCreatable={isCreatable}
            footer={footer}
            isMultiSelect
          />
        </PfSelect>
      </WizFormGroup>
    </div>
  )
}
