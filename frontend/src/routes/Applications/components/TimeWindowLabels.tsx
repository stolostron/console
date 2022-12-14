/* Copyright Contributors to the Open Cluster Management project */

import { Fragment } from 'react'
import LabelWithPopover from './LabelWithPopover'
import { AcmButton } from '../../../ui-components'
import { ButtonVariant } from '@patternfly/react-core'
import { PencilAltIcon } from '@patternfly/react-icons'
import '../css/TimeWindowLabels.css'
import { useTranslation } from '../../../lib/acm-i18next'

export interface ITimeWindowLabelsProps {
    subName: string
    type: string
    days: string[]
    timezone?: string
    ranges?: string[]
    missingData?: any
}

export function TimeWindowLabels(props: ITimeWindowLabelsProps) {
    const { t } = useTranslation()
    const notSelectedLabel = t('Not selected')

    const { subName, type, days, timezone, ranges, missingData } = props

    function createTimeRanges(ranges: any[]) {
        let timeRanges = ''

        ranges.forEach((range, i) => {
            const startTime = range.start.toLowerCase().replace(/^0/, '')
            const endTime = range.end.toLowerCase().replace(/^0/, '')
            const timeRange = startTime + ' - ' + endTime
            timeRanges = timeRanges.concat(timeRange + (i !== ranges.length - 1 ? ', ' : ''))
        })

        return timeRanges
    }

    return (
        <div className="label-with-popover-container timeWindow-labels">
            <LabelWithPopover
                key={subName + '-timeWindow'}
                labelContent={<div className="timeWindow-status-icon">{type}</div>}
                labelColor={type === 'active' ? 'green' : 'orange'}
            >
                <div className="timeWindow-labels-popover-content">
                    {missingData ? (
                        <div className="timeWindow-content">
                            {t('Go to the Editor tab to view time window information.')}
                        </div>
                    ) : (
                        <Fragment>
                            <div className="timeWindow-title">{t('Days of the week')}</div>
                            <div className="timeWindow-content">{days ? days.join(', ') : notSelectedLabel}</div>

                            <div className="timeWindow-title">{t('Time zone')}</div>
                            <div className="timeWindow-content">{timezone ? timezone : notSelectedLabel}</div>

                            <div className="timeWindow-title">{t('Time range')}</div>
                            <div className="timeWindow-content">
                                {ranges ? createTimeRanges(ranges) : notSelectedLabel}
                            </div>
                        </Fragment>
                    )}
                    <AcmButton
                        id="set-time-window-link"
                        target="_blank"
                        component="a"
                        href={''} //TODO: update once edit link is in
                        variant={ButtonVariant.link}
                        rel="noreferrer"
                        icon={<PencilAltIcon />}
                        iconPosition="right"
                    >
                        {t('Edit time window')}
                    </AcmButton>
                </div>
            </LabelWithPopover>
        </div>
    )
}
