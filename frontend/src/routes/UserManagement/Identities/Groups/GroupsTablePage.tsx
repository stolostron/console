/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { GroupsTable } from './GroupsTable'

const GroupsTablePage = () => (
  <PageSection>
    <GroupsTable hiddenColumns={['radio']} />
  </PageSection>
)

export { GroupsTablePage }
