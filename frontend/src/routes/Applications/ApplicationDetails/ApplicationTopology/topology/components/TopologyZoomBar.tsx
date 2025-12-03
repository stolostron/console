/* Copyright Contributors to the Open Cluster Management project */
import {
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar as PfTopologyControlBar,
  useVisualizationController,
  action,
} from '@patternfly/react-topology'
import '../css/topology-zoombar.css'

const TopologyZoomBar: React.FC<{ collapseAllCallback?: (collapseAll: boolean) => void }> = ({
  collapseAllCallback,
}) => {
  const controller = useVisualizationController()

  return (
    <PfTopologyControlBar
      className="topology-zoombar"
      controlButtons={createTopologyControlButtons({
        ...defaultControlButtonsOptions,
        expandAll: !!collapseAllCallback,
        collapseAll: !!collapseAllCallback,
        zoomInCallback: action(() => {
          controller.getGraph().scaleBy(4 / 3)
        }),
        zoomOutCallback: action(() => {
          controller.getGraph().scaleBy(0.75)
        }),
        fitToScreenCallback: action(() => {
          controller.getGraph().fit(80)
        }),
        resetViewCallback: action(() => {
          controller.getGraph().reset()
          controller.getGraph().layout()
        }),
        legend: false,
      })}
    />
  )
}

export default TopologyZoomBar
