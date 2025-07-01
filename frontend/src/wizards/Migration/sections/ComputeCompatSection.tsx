/* Copyright Contributors to the Open Cluster Management project */
import { FormGroup, Title } from '@patternfly/react-core'

interface ComputeCompatSectionProps {
  srcCompute: string
  dstCompute: string
}

export function ComputeCompatSection(props: ComputeCompatSectionProps) {
  const { srcCompute, dstCompute } = props
  return (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Compute compatibility
      </Title>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <FormGroup
          label={<Title headingLevel="h4">Source cluster compute</Title>}
          fieldId="src-compute"
          style={{ flex: 1 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              padding: '0.5rem',
              minHeight: 36,
            }}
          >
            {srcCompute || '-'}
          </div>
        </FormGroup>
        <FormGroup
          label={<Title headingLevel="h4">Target cluster compute</Title>}
          fieldId="dst-compute"
          style={{ flex: 1 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              padding: '0.5rem',
              minHeight: 36,
            }}
          >
            {dstCompute || '-'}
          </div>
        </FormGroup>
      </div>
    </>
  )
}
