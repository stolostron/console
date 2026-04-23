/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  MenuToggle,
  MenuToggleElement,
  Select as PfSelect,
} from '@patternfly/react-core'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { getSelectPlaceholder, InputCommonProps, useInput } from './Input'
import { InputSelect, SelectListOptions } from './InputSelect'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

export interface WizLabelSelectOption {
  label: string
  value: string
}

export type WizLabelSelectProps = InputCommonProps<string> & {
  label: string
  placeholder?: string
  isCreatable?: boolean
  footer?: ReactNode
  options: (string | WizLabelSelectOption)[]
}

/**
 * A single-select dropdown that displays the selected value as a PatternFly Label pill,
 * similar to how WizMultiSelect displays its selected values.
 * When no value is selected, shows a typeahead input with placeholder.
 * When a value is selected, shows a simple toggle with the Label pill.
 */
export function WizLabelSelect(props: WizLabelSelectProps) {
  const { displayMode: mode, value, setValue, validated, hidden, id, disabled, required } = useInput(props)
  const { noResults } = useStringContext()
  const { label, readonly, isCreatable, footer } = props
  const placeholder = getSelectPlaceholder(props)
  const [open, setOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])

  // Normalize options to { label, value } pairs
  const normalizedOptions = useMemo(
    () => props.options.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt)),
    [props.options]
  )

  // String options for InputSelect (uses labels for display)
  const stringOptions = useMemo(() => normalizedOptions.map((opt) => opt.label), [normalizedOptions])

  const labelToValue = useMemo(() => {
    const map = new Map<string, string>()
    for (const opt of normalizedOptions) {
      if (!map.has(opt.label)) {
        map.set(opt.label, opt.value)
      }
    }
    return map
  }, [normalizedOptions])

  useEffect(() => {
    setFilteredOptions(stringOptions)
  }, [stringOptions])

  // Find display label for the current value
  const displayLabel = useMemo(() => {
    const match = normalizedOptions.find((opt) => opt.value === value)
    return match?.label ?? value ?? ''
  }, [normalizedOptions, value])

  const onSelect = useCallback(
    (selectedLabel: string | undefined) => {
      if (!selectedLabel) {
        setValue(undefined)
        setOpen(false)
        return
      }
      const selectedValue = labelToValue.get(selectedLabel) ?? selectedLabel

      if (selectedValue === value) {
        setValue(undefined)
      } else {
        setValue(selectedValue)
      }
      setOpen(false)
    },
    [setValue, value, labelToValue]
  )

  const handleSetOptions = useCallback(
    (o: string[]) => {
      if (o.length > 0) {
        const filtered = stringOptions.filter((option) => o.includes(option))
        if (displayLabel && !stringOptions.includes(displayLabel)) {
          filtered.unshift(displayLabel)
        }
        setFilteredOptions([...new Set([...filtered, ...o])])
      } else {
        setFilteredOptions([noResults])
      }
    },
    [noResults, stringOptions, displayLabel]
  )

  if (hidden) return null

  if (mode === DisplayMode.Details) {
    if (!value) return null
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{label}</DescriptionListTerm>
        <DescriptionListDescription id={id}>
          <Label variant="outline">{displayLabel}</Label>
        </DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) =>
    value ? (
      <MenuToggle
        ref={toggleRef}
        onClick={() => {
          if (!open) setFilteredOptions(stringOptions)
          setOpen(!open)
        }}
        isExpanded={open}
        isDisabled={disabled || readonly}
        status={validated === 'error' ? 'danger' : undefined}
      >
        <Label variant="outline">{displayLabel}</Label>
      </MenuToggle>
    ) : (
      <InputSelect
        disabled={disabled || readonly}
        validated={validated}
        placeholder={placeholder}
        required={required}
        options={stringOptions}
        setOptions={handleSetOptions}
        isCreatable={isCreatable}
        toggleRef={toggleRef}
        value=""
        onSelect={onSelect}
        open={open}
        setOpen={setOpen}
      />
    )

  return (
    <div id={id}>
      <WizFormGroup {...props} id={id}>
        <PfSelect
          isOpen={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setOpen(false)
            }
          }}
          toggle={toggle}
          selected={displayLabel}
          onSelect={(_event, value) => {
            const selected = value?.toString() ?? ''
            if (selected !== noResults) {
              onSelect(selected)
            }
          }}
          isScrollable
        >
          <SelectListOptions
            value={displayLabel}
            allOptions={stringOptions}
            filteredOptions={filteredOptions}
            isCreatable={isCreatable}
            footer={footer}
          />
        </PfSelect>
      </WizFormGroup>
    </div>
  )
}
