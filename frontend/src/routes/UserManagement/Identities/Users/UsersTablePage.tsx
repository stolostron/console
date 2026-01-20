/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { AcmTableStateProvider } from '../../../../ui-components'
import { UsersTable } from './UsersTable'

const UsersTablePage = () => (
  <PageSection hasBodyWrapper={false}>
    <AcmTableStateProvider localStorageKey={'identities-users-table-state'}>
      <UsersTable hiddenColumns={['radio']} />
    </AcmTableStateProvider>
  </PageSection>
)

export { UsersTablePage }
