/* Copyright Contributors to the Open Cluster Management project */

import { ReactElement, useCallback } from 'react'
import { LegendViewProps, LegendStatusType } from '../types'

/**
 * LegendView component displays a visual legend for the application topology view.
 * It provides explanatory text about the topology visualization and shows status icon
 * meanings with color-coded descriptions for different deployment states.
 *
 * The component renders:
 * - Descriptive text about the topology visualization
 * - SVG legend graphics showing visual elements
 * - Status icon legend with color-coded descriptions
 * - Informational notes about permissions and resource access
 */
function LegendView({ t }: LegendViewProps): ReactElement {
  const renderStatusDescriptions = useCallback((): ReactElement[] => {
    const statusList: LegendStatusType[] = ['success', 'pending', 'warning', 'failure']

    const iconColorMap = new Map<LegendStatusType, string>([
      ['success', '#3E8635'],
      ['pending', '#878D96'],
      ['warning', '#F0AB00'],
      ['failure', '#C9190B'],
    ])

    const descriptionMap = new Map<LegendStatusType, string>([
      [
        'success',
        t(
          'All resources in this group have deployed on the target clusters, although their status might not be successful.'
        ),
      ],
      ['pending', t('The statues in this resource group have not been found and are unknown.')],
      ['warning', t('Some resources in this group did not deploy. Other resources deployed successfully.')],
      ['failure', t('Some resources in this group are in error state.')],
    ])

    return statusList.map((status: LegendStatusType) => {
      return (
        <div key={status} className="bodyText">
          <div>
            <svg className="statusSvg" fill={iconColorMap.get(status)}>
              <use href={`#nodeStatusIcon_${status}`} className="label-icon" />
            </svg>
          </div>
          <div>{descriptionMap.get(status)}</div>
        </div>
      )
    })
  }, [t])

  return (
    <section className="topologyDetails">
      <div className="legendHeader">
        <div>
          <div className="bodyText">
            {t(
              'The topology provides a visual representation of all the applications and resources within a project, their build status, and the components and services associated with them.'
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <svg height="140px">
              <use href={'#drawerShapes_legend'} className="label-icon" />
            </svg>
            <svg height="100px">
              <use href={'#drawerShapes_legend2'} className="label-icon" />
            </svg>
          </div>
        </div>
      </div>

      <hr />

      <div className="legendBody">
        <div>
          <div className="titleText">{t('Status icon legend')}</div>

          <div className="titleNoteText">
            {t('Note: Resources that you do not have permission to view display a status of "Not deployed".')}
          </div>

          {renderStatusDescriptions()}

          <div className="bodyText">
            {t('For more details and logs, click on the nodes to open the properties view.')}
          </div>
        </div>
      </div>
    </section>
  )
}

export default LegendView
