/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { FormGroup, Title } from '@patternfly/react-core'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import { PencilAltIcon } from '@patternfly/react-icons'
import { SelectOptionInput } from '../../../components/AcmFormData'

interface NetworkMappingSectionProps {
  srcNetwork: string
  dstNetwork: string
  setDstNetwork: (value: string) => void
  options: SelectOptionInput[]
}

export function NetworkMappingSection(props: NetworkMappingSectionProps) {
  const { srcNetwork, dstNetwork, setDstNetwork, options } = props

  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Network mapping
      </Title>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <FormGroup
          label={
            <Title headingLevel="h4" style={{ margin: 0 }}>
              Source network
            </Title>
          }
          fieldId="src-network"
          style={{ flex: 1, padding: 0 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              minHeight: 36,
              padding: '0.5rem',
            }}
          >
            {srcNetwork || '-'}
          </div>
        </FormGroup>

        <FormGroup
          label={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title headingLevel="h4" style={{ margin: 0 }}>
                Target network
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
                  <PencilAltIcon style={{ marginRight: 4 }} />
                  Edit
                </button>
              )}
            </div>
          }
          fieldId="dst-network"
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
              {dstNetwork || '-'}
            </div>
          ) : (
            <Select
              id="dst-network"
              variant={SelectVariant.single}
              isOpen={isOpen}
              selections={dstNetwork}
              onToggle={(_, open) => setIsOpen(open)}
              onSelect={(_, value) => {
                setDstNetwork(value as string)
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
