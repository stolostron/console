// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Scrollbars } from 'react-custom-scrollbars'
import { TimesIcon } from '@patternfly/react-icons'
import { defaultShapes } from './defaults/shapes'
import { getLegendTitle } from './defaults/titles'

class LegendView extends React.Component {
    render() {
        const { t, onClose } = this.props

        return (
            <section className="topologyDetails">
                <div>
                    <TimesIcon
                        className="closeIcon"
                        description={t('topology.legend.close')}
                        onClick={onClose}
                    />
                    <hr style={{ visibility: 'hidden', marginBottom: '20px' }} />
                </div>
                <Scrollbars renderView={this.renderView} className="legend-view-container">
                    <div className="legendHeader">
                        <div>
                            <div className="titleText">{t('topology.legend.header.title')}</div>
                            <div className="bodyText">{t('topology.legend.header.text')}</div>
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
                            <div className="titleText">{t('topology.legend.body.status.title')}</div>
                            <div className="titleNoteText">{t('topology.legend.body.status.note')}</div>
                            {this.renderStatusDescriptions()}
                            <div className="bodyText">{t('topology.legend.body.status.logs')}</div>
                        </div>
                    </div>
                </Scrollbars>
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
            ['success', 'topology.legend.body.text.success'],
            ['pending', 'topology.legend.body.text.pending'],
            ['warning', 'topology.legend.body.text.warning'],
            ['failure', 'topology.legend.body.text.failure'],
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

    renderResourceIcons = () => {
        const { t } = this.props
        const nodeTypes = new Set()
        const nodes = this.props.getLayoutNodes()
        if (nodes && nodes.length > 0) {
            nodes.forEach((node) => {
                const { type } = node
                if (type) {
                    nodeTypes.add(type)
                }
            })
        }
        return Array.from(nodeTypes).map((type) => {
            const { shape = 'other' } = defaultShapes[type] || {}
            return (
                <div key={type} className="bodyIconsTextDiv">
                    <div>{getLegendTitle(type, t)}</div>
                    <div>
                        <svg className="iconSvg">
                            <use href={`#diagramShapes_${shape}`} className="label-icon" />
                        </svg>
                    </div>
                </div>
            )
        })
    }

    renderView({ style, ...props }) {
        style.height = 'calc(100vh - 300px)'
        return <div {...props} style={{ ...style }} />
    }
}

LegendView.propTypes = {
    getLayoutNodes: PropTypes.func,
    t: PropTypes.func,
    onClose: PropTypes.func,
}

export default LegendView
