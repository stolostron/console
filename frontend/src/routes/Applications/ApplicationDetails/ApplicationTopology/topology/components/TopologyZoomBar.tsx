/* Copyright Contributors to the Open Cluster Management project */
import {
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar as PfTopologyControlBar,
  useVisualizationController,
  action,
} from '@patternfly/react-topology'
import '../css/topology-zoombar.css'
import { useTranslation } from '../../../../../../lib/acm-i18next'

const TopologyZoomBar: React.FC<{ collapseAllCallback?: (collapseAll: boolean) => void }> = ({
  collapseAllCallback,
}) => {
  const controller = useVisualizationController()
  const { t } = useTranslation()
  return (
    <PfTopologyControlBar
      className="topology-zoombar"
      controlButtons={createTopologyControlButtons({
        ...defaultControlButtonsOptions,
        expandAll: !!collapseAllCallback,
        collapseAll: !!collapseAllCallback,
        zoomInTip: t('Zoom In'),
        zoomInAriaLabel: t('Zoom In'),
        zoomInCallback: action(() => {
          controller.getGraph().scaleBy(4 / 3)
        }),
        zoomOutTip: t('Zoom Out'),
        zoomOutAriaLabel: t('Zoom Out'),
        zoomOutCallback: action(() => {
          controller.getGraph().scaleBy(0.75)
        }),
        fitToScreenTip: t('Fit to Screen'),
        fitToScreenAriaLabel: t('Fit to Screen'),
        fitToScreenCallback: action(() => {
          controller.getGraph().fit(80)
        }),
        resetViewTip: t('Reset View'),
        resetViewAriaLabel: t('Reset View'),
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
