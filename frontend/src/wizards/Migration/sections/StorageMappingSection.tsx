/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { FormGroup, Title } from '@patternfly/react-core'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import { PencilAltIcon } from '@patternfly/react-icons'
import { SelectOptionInput } from '../../../components/AcmFormData'

interface StorageMappingSectionProps {
  srcStorage: string
  dstStorage: string
  setDstStorage: (value: string) => void
  options: SelectOptionInput[]
}

export function StorageMappingSection(props: StorageMappingSectionProps) {
  const { srcStorage, dstStorage, setDstStorage, options } = props
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Storage mapping
      </Title>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <FormGroup label={<Title headingLevel="h4">Source storage</Title>} fieldId="src-storage" style={{ flex: 1 }}>
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              minHeight: 36,
              padding: '0.5rem',
            }}
          >
            {srcStorage || '-'}
          </div>
        </FormGroup>
        <FormGroup
          label={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title headingLevel="h4" style={{ margin: 0 }}>
                Target storage
              </Title>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    marginLeft: '1rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--pf-v5-global--link--Color)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <PencilAltIcon style={{ marginRight: 4 }} /> Edit
                </button>
              )}
            </div>
          }
          fieldId="dst-storage"
          style={{ flex: 1 }}
        >
          {!isEditing ? (
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
                padding: '0.5rem',
              }}
            >
              {dstStorage || '-'}
            </div>
          ) : (
            <Select
              id="dst-storage"
              variant={SelectVariant.single}
              isOpen={isOpen}
              selections={dstStorage}
              onToggle={(_, open) => setIsOpen(open)}
              onSelect={(_, value) => {
                setDstStorage(value as string)
                setIsOpen(false)
                setIsEditing(false)
              }}
            >
              {options.map((o) => (
                <SelectOption key={o.id} value={o.value}>
                  {o.text}
                </SelectOption>
              ))}
            </Select>
          )}
        </FormGroup>
      </div>
    </>
  )
}
