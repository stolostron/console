/* Copyright Contributors to the Open Cluster Management project */

import { Component, ReactElement } from 'react'
import { LegendViewProps, LegendStatusType } from '../model/types'

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
class LegendView extends Component<LegendViewProps> {
  /**
   * Renders the main legend view component
   * @returns JSX element containing the complete legend interface
   */
  render(): ReactElement {
    const { t } = this.props

    return (
      <section className="topologyDetails">
        {/* Header section with descriptive text and visual legend */}
        <div className="legendHeader">
          <div>
            {/* Main description of topology functionality */}
            <div className="bodyText">
              {t(
                'The topology provides a visual representation of all the applications and resources within a project, their build status, and the components and services associated with them.'
              )}
            </div>
            {/* SVG legend graphics showing visual topology elements */}
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

        {/* Body section with status icon legend */}
        <div className="legendBody">
          <div>
            {/* Status legend title */}
            <div className="titleText">{t('Status icon legend')}</div>

            {/* Permission note for users */}
            <div className="titleNoteText">
              {t('Note: Resources that you do not have permission to view display a status of "Not deployed".')}
            </div>

            {/* Render status descriptions with icons and explanations */}
            {this.renderStatusDescriptions()}

            {/* Additional help text for user interaction */}
            <div className="bodyText">
              {t('For more details and logs, click on the nodes to open the properties view.')}
            </div>
          </div>
        </div>
      </section>
    )
  }

  /**
   * Renders the status descriptions section with color-coded icons and explanatory text.
   * Each status type (success, pending, warning, failure) is displayed with its corresponding
   * icon color and description of what that status means in the topology context.
   *
   * @returns Array of JSX elements, each representing a status type with icon and description
   */
  renderStatusDescriptions = (): ReactElement[] => {
    const { t } = this.props

    // Define the order of status types to display
    const statusList: LegendStatusType[] = ['success', 'pending', 'warning', 'failure']

    // Map status types to their corresponding icon colors
    const iconColorMap = new Map<LegendStatusType, string>([
      ['success', '#3E8635'], // Green - successful deployment
      ['pending', '#878D96'], // Gray - unknown/pending status
      ['warning', '#F0AB00'], // Yellow/Orange - partial deployment
      ['failure', '#C9190B'], // Red - deployment errors
    ])

    // Map status types to their human-readable descriptions
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

    // Generate JSX elements for each status type
    return statusList.map((status: LegendStatusType) => {
      return (
        <div key={status} className="bodyText">
          {/* Status icon with appropriate color */}
          <div>
            <svg className="statusSvg" fill={iconColorMap.get(status)}>
              <use href={`#nodeStatusIcon_${status}`} className="label-icon" />
            </svg>
          </div>
          {/* Status description text */}
          <div>{descriptionMap.get(status)}</div>
        </div>
      )
    })
  }
}

export default LegendView
