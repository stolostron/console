/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { AcmTableStateProvider } from '../../../../ui-components'
import { GroupsTable } from './GroupsTable'

const GroupsTablePage = () => (
  <PageSection hasBodyWrapper={false}>
    <AcmTableStateProvider localStorageKey={'identities-groups-table-state'}>
      <GroupsTable hiddenColumns={['radio']} />
    </AcmTableStateProvider>
  </PageSection>
)

export { GroupsTablePage }
