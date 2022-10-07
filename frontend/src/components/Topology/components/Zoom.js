/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import PropTypes from 'prop-types'
import { ExpandIcon, SearchPlusIcon, SearchMinusIcon } from '@patternfly/react-icons'
import '../css/diagram-controls.css'
import { PureComponent } from 'react'

const MAX_ZOOM = 2
const MIN_ZOOM = 0.1

export default class Zoom extends PureComponent {
    setZoomInRef = (ref) => {
        this.zoomInRef = ref
    }
    setZoomOutRef = (ref) => {
        this.zoomOutRef = ref
    }

    render() {
        const { t } = this.props
        const zoomIn = t('Zoom in')
        const zoomOut = t('Zoom out')
        const zoomFit = t('Zoom to fit')

        return (
            <div className="diagram-controls">
                {/* zoom in */}
                <div
                    className="zoom-in-button rectangle-zoom"
                    tabIndex="0"
                    role={'button'}
                    ref={this.setZoomInRef}
                    title={zoomIn}
                    aria-label={zoomIn}
                    onClick={this.handleZoomIn}
                    onKeyPress={this.handleZoomIn}
                >
                    <div className="icon">
                        <SearchPlusIcon />
                    </div>
                </div>
                {/* zoom out */}
                <div
                    className="zoom-out-button rectangle-zoom"
                    tabIndex="0"
                    role={'button'}
                    ref={this.setZoomOutRef}
                    title={zoomOut}
                    aria-label={zoomOut}
                    onClick={this.handleZoomOut}
                    onKeyPress={this.handleZoomOut}
                >
                    <div className="icon">
                        <SearchMinusIcon />
                    </div>
                </div>
                {/* zoom target */}
                <div
                    className="zoom-target-button rectangle-zoom"
                    tabIndex="0"
                    role={'button'}
                    title={zoomFit}
                    aria-label={zoomFit}
                    onClick={this.handleZoomToTarget}
                    onKeyPress={this.handleZoomToTarget}
                >
                    <div className="icon">
                        <ExpandIcon />
                    </div>
                </div>
            </div>
        )
    }

    handleZoomIn = (e) => {
        if (e.type === 'click' || e.key === 'Enter') {
            this.props.getZoomHelper().buttonZoom(1.3, this.updateZoomButtons)
        }
    }

    handleZoomOut = (e) => {
        if (e.type === 'click' || e.key === 'Enter') {
            this.props.getZoomHelper().buttonZoom(1 / 1.3, this.updateZoomButtons)
        }
    }

    handleZoomToTarget = (e) => {
        if (e.type === 'click' || e.key === 'Enter') {
            const { getViewContainer, getZoomHelper } = this.props
            getViewContainer().scrollTo(0, 0)
            getZoomHelper().zoomFit(true, false, this.updateZoomButtons)
        }
    }

    updateZoomButtons = (zoom) => {
        this.zoomInRef.disabled = zoom.k >= MAX_ZOOM
        this.zoomInRef.classList.toggle('disabled', zoom.k >= MAX_ZOOM)
        this.zoomOutRef.disabled = zoom.k <= MIN_ZOOM
        this.zoomOutRef.classList.toggle('disabled', zoom.k <= MIN_ZOOM)
    }
}

Zoom.propTypes = {
    getViewContainer: PropTypes.func,
    getZoomHelper: PropTypes.func,
    locale: PropTypes.string,
}
