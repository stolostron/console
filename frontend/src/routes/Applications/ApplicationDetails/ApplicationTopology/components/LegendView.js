// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React from 'react'
import PropTypes from 'prop-types'

class LegendView extends React.Component {
    render() {
        const { t } = this.props

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
                            <svg>
                                <use href={'#diagramShapes_legend'} className="label-icon" />
                            </svg>
                        </div>
                    </div>
                </div>
                <hr />
                <div className="legendBody">
                    <div>
                        <div className="titleText">{t('Status icon legend')}</div>
                        <div className="titleNoteText">
                            {t(
                                'Note: Resources that you do not have permission to view display a status of "Not deployed".'
                            )}
                        </div>
                        {this.renderStatusDescriptions()}
                        <div className="bodyText">
                            {t('For more details and logs, click on the nodes to open the properties view.')}
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    renderStatusDescriptions = () => {
        const { t } = this.props
        const statusList = ['success', 'pending', 'warning', 'failure']
        const iconColorMap = new Map([
            ['success', '#3E8635'],
            ['pending', '#878D96'],
            ['warning', '#F0AB00'],
            ['failure', '#C9190B'],
        ])
        const descriptionMap = new Map([
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
        return statusList.map((status) => {
            return (
                <div key={status} className="bodyText">
                    <div>
                        <svg className="statusSvg" fill={iconColorMap.get(status)}>
                            <use href={`#diagramIcons_${status}`} className="label-icon" />
                        </svg>
                    </div>
                    <div>{t(descriptionMap.get(status))}</div>
                </div>
            )
        })
    }
}

LegendView.propTypes = {
    t: PropTypes.func,
}

export default LegendView
