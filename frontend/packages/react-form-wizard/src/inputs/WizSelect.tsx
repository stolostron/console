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
import get from 'get-value'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import { InputSelect, NoResults, SelectListOptions } from './InputSelect'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

export interface Option<T> {
  id?: string
  label: string
  description?: string
  value: T
  disabled?: boolean
}

export type OptionType<T> = Omit<Option<T>, 'value'> & { value: string | number | T; keyedValue: string | number }

export interface OptionGroup<T> {
  id?: string
  label: string
  options: (Option<T> | string | number)[] | undefined
}

type WizSelectCommonProps<T> = InputCommonProps<T> & {
  placeholder?: string
  footer?: ReactNode
  label: string

  /** key path is the path to get the key of the value
   * Used in cases where the value is an object, but we need to track select by a string or number
   */
  keyPath?: string
  isCreatable?: boolean
  onCreate?: (value: string) => void
}

interface WizSelectSingleProps<T> extends WizSelectCommonProps<T> {
  variant: 'single'
  options?: (Option<T> | string | number)[]
}

export function WizSelect<T>(props: Omit<WizSelectSingleProps<T>, 'variant'>) {
  return <WizSelectBase<T> {...props} variant="single" />
}

type SelectProps<T> = WizSelectSingleProps<T>

function WizSelectBase<T = any>(props: SelectProps<T>) {
  const { displayMode: mode, value, setValue, validated, hidden, id, disabled } = useInput(props)
  const placeholder = getSelectPlaceholder(props)
  const keyPath = props.keyPath ?? props.path
  const isCreatable = props.isCreatable
  const [open, setOpen] = useState(false)

  const [filteredOptions, setFilteredOptions] = useState<OptionType<T>[]>([])

  // The drop down items with descriptions - optionally grouped
  const selectOptions: OptionType<T>[] | undefined = useMemo(() => {
    return props.options?.map((option) => {
      let id: string
      let label: string
      let value: string | number | T
      let keyedValue: string | number
      let description: string | undefined
      if (typeof option === 'string' || typeof option === 'number') {
        id = option.toString()
        label = option.toString()
        value = option
        keyedValue = option
      } else {
        id = option.id ?? option.label
        label = option.label
        if (!keyPath) throw new Error('keyPath is required')
        value = option.value
        description = option.description
        keyedValue = get(value as any, keyPath)
        switch (typeof keyedValue) {
          case 'string':
          case 'number':
            break
          default:
            throw new Error('keyedValue is not a string or number')
        }
      }
      return { id, label, value, keyedValue, description }
    })
  }, [props.options, keyPath])

  const inputSelectOptions = useMemo(() => {
    return selectOptions?.map((option) => option.value?.toString() ?? '') ?? []
  }, [selectOptions])

  const handleSetOptions = useCallback(
    (o: string[]) => {
      const filtered =
        selectOptions?.filter((option) => {
          const valueStr =
            typeof option.value === 'string'
              ? option.value
              : typeof option.value === 'number'
              ? option.value.toString()
              : String(option.value)
          return o.includes(valueStr)
        }) ?? []

      if (filtered.length > 0) {
        setFilteredOptions([...filtered, { id: 'input', label: '', value: o[0], keyedValue: '' }])
      } else {
        setFilteredOptions([{ id: o[0], label: NoResults, value: o[0], keyedValue: '' }])
      }
    },
    [selectOptions]
  )

  const onSelect = useCallback(
    (selectOptionObject: string | undefined) => {
      const idOption = selectOptions?.find((o) => o.id === selectOptionObject)
      if (idOption) {
        setValue(idOption.value)
      } else {
        setValue(selectOptionObject)
      }
      setOpen(false)
    },
    [setValue, selectOptions]
  )

  if (hidden) return null

  if (mode === DisplayMode.Details) {
    if (!value) return null
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{props.label}</DescriptionListTerm>
        <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  return (
    <div id={id}>
      <WizFormGroup {...props}>
        <InputGroup>
          <InputGroupItem isFill>
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
                  options={inputSelectOptions}
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
                onCreate={props.onCreate}
                footer={props.footer}
              />
            </PfSelect>
          </InputGroupItem>
        </InputGroup>
      </WizFormGroup>
    </div>
  )
}
