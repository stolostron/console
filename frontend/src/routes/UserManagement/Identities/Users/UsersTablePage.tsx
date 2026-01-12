/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { UsersTable } from './UsersTable'

const UsersTablePage = () => (
  <PageSection hasBodyWrapper={false}>
    <UsersTable hiddenColumns={['radio']} />
  </PageSection>
)

export { UsersTablePage }
