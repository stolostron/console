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
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { SpinnerButton } from '../components/SpinnerButton'
import { SyncButton } from '../components/SyncButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { getSelectPlaceholder, InputCommonProps, useInput } from './Input'
import { InputSelect, SelectListOptions } from './InputSelect'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

type WizAsyncSelectProps = InputCommonProps<string> & {
  label: string
  placeholder?: string
  isCreatable?: boolean
  asyncCallback?: () => Promise<string[]>
  footer?: ReactNode
}

export function WizAsyncSelect(props: WizAsyncSelectProps) {
  const { asyncCallback, isCreatable, footer } = props
  const { displayMode, value, setValue, validated, hidden, id, disabled } = useInput(props)
  const { noResults } = useStringContext()
  const placeholder = getSelectPlaceholder(props)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [filterValue, setFilterValue] = useState<string>(value || '')
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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

  const sync = useCallback(() => {
    if (displayMode !== DisplayMode.Step) return
    if (asyncCallback) {
      setLoading((loading) => {
        if (loading) return loading
        if (asyncCallback) {
          asyncCallback()
            .then((options) => {
              if (Array.isArray(options) && options.every((option) => typeof option === 'string')) {
                const ops = isCreatable && value ? [...options, value] : options
                setOptions(ops)
                setFilteredOptions(ops)
              } else {
                // eslint-disable-next-line no-console
                console.warn('AsyncSelect: options is not an array of strings')
                setOptions([])
              }
            })
            .catch(() => null)
            .finally(() => setLoading(false))
          return true
        }
        return false
      })
    }
  }, [asyncCallback, displayMode, isCreatable, value])

  useEffect(() => sync(), [sync])

  if (hidden) return null

  if (displayMode === DisplayMode.Details) {
    if (!value) return null
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{props.label}</DescriptionListTerm>
        <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  return (
    <WizFormGroup {...props} id={id}>
      <InputGroup>
        <InputGroupItem isFill>
          <PfSelect
            onOpenChange={(isOpen) => {
              !isOpen && setOpen(false)
            }}
            isOpen={open}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <InputSelect
                disabled={disabled || (loading && !isCreatable)}
                validated={validated}
                placeholder={placeholder}
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
            shouldFocusFirstItemOnOpen={false}
          >
            <SelectListOptions
              allOptions={options}
              filteredOptions={filteredOptions}
              value={value}
              isCreatable={isCreatable}
              footer={footer}
            />
          </PfSelect>
        </InputGroupItem>
        {props.asyncCallback && loading && <SpinnerButton />}
        {props.asyncCallback && !loading && <SyncButton onClick={sync} />}
      </InputGroup>
    </WizFormGroup>
  )
}
