/* Copyright Contributors to the Open Cluster Management project */
import { TopologySideBar } from '@patternfly/react-topology'

export interface TopologyDetailsViewProps {
  selectedIds?: string[]
  setSelectedIds: (ids: string[]) => void
}

export const TopologyDetailsView: React.FC<TopologyDetailsViewProps> = ({ selectedIds, setSelectedIds }) => {
  return (
    <TopologySideBar show={!!selectedIds?.length} resizable={true} onClose={() => setSelectedIds([])}>
      <div style={{ marginTop: 27, marginLeft: 20, height: '800px', backgroundColor: 'red' }}>{selectedIds?.[0]}</div>
    </TopologySideBar>
  )
}
