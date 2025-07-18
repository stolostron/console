/* Copyright Contributors to the Open Cluster Management project */
import { Divider, FormGroup, Title } from '@patternfly/react-core'

export function VersionCompatSection() {
  return (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Version compatibility
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title headingLevel="h5" style={{ marginBottom: '0.5rem' }}>
          OpenShift version
        </Title>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <FormGroup label="Source cluster" fieldId="src-ocp" style={{ flex: 1 }}>
            <div className="pf-c-form-control">4.20</div>
          </FormGroup>
          <FormGroup label="Target cluster" fieldId="dst-ocp" style={{ flex: 1 }}>
            <div className="pf-c-form-control">4.20</div>
          </FormGroup>
        </div>
      </div>

      <Divider style={{ width: '70%', margin: '2rem 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title headingLevel="h5" style={{ marginBottom: '0.5rem' }}>
          Virtualization operator version
        </Title>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <FormGroup label="Source cluster" fieldId="src-virt" style={{ flex: 1 }}>
            <div className="pf-c-form-control">4.19</div>
          </FormGroup>
          <FormGroup label="Target cluster" fieldId="dst-virt" style={{ flex: 1 }}>
            <div className="pf-c-form-control">4.19</div>
          </FormGroup>
        </div>
      </div>
    </>
  )
}
