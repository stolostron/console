/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import moment from 'moment'
import { Spinner } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'

export type AcmRefreshTimeProps = {
    timestamp: string
    reloading?: boolean
}

const useStyles = makeStyles({
    timestamp: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        color: 'var(--pf-global--Color--200)',
        fontSize: '10px',
        lineHeight: '20px',

        '& .pf-c-spinner': {
            marginRight: '.4rem',
        },
    },
})

export const AcmRefreshTime = (props: AcmRefreshTimeProps) => {
    const classes = useStyles()
    const { reloading, timestamp } = props
    const time = moment(new Date(timestamp)).format('LTS')
    const { t } = useTranslation()
    return (
        <div className={classes.timestamp}>
            {reloading && <Spinner size="sm" />}
            <p>
                {t('Last update:')} {time}
            </p>
        </div>
    )
}
