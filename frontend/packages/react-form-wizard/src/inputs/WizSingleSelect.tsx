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
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import { InputSelect, NoResults, SelectListOptions } from './InputSelect'
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
  const { displayMode: mode, value, setValue, validated, hidden, id, disabled } = useInput(props)
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

  const handleSetOptions = useCallback((o: string[]) => {
    if (o.length > 0) {
      setFilteredOptions(o)
    } else {
      setFilteredOptions([NoResults])
    }
  }, [])

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
                  options={options}
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
              <SelectListOptions value={value} options={filteredOptions} isCreatable={isCreatable} footer={footer} />
            </PfSelect>
          </InputGroupItem>
        </InputGroup>
      </WizFormGroup>
    </div>
  )
}
