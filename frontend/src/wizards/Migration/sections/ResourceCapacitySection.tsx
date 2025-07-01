/* Copyright Contributors to the Open Cluster Management project */
import { Divider, Split, Title } from '@patternfly/react-core'
import { StorageBulletChart } from '../StorageBulletChart'
import { useMigrationFormState } from '../useMigrationFormState'

export function ResourceCapacitySection() {
  const { storageUsed, storageReserved, storageTotal } = useMigrationFormState()

  return (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Resource capacity
      </Title>
      <Title headingLevel="h5">Source size</Title>
      <div>Storage {storageTotal} GB</div>
      <div>Memory XXX GB</div>
      <div>CPU XXX cores</div>
      <Divider style={{ margin: '1rem 0', width: '70%' }} />
      <Title headingLevel="h5">Target cluster capacity (Cluster 2)</Title>
      <Split style={{ marginBottom: '5rem' }}>
        <StorageBulletChart used={storageUsed} reserved={storageReserved} total={storageTotal} />
        <StorageBulletChart used={storageUsed} reserved={storageReserved} total={storageTotal} />
      </Split>
      <Split style={{ marginBottom: '5rem' }}>
        <StorageBulletChart used={storageUsed} reserved={storageReserved} total={storageTotal} />
      </Split>
    </>
  )
}
