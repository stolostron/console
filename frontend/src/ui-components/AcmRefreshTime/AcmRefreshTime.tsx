/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import moment from 'moment'
import { Spinner } from '@patternfly/react-core'

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

    return (
        <div className={classes.timestamp}>
            {reloading && <Spinner size="sm" />}
            <p>Last update: {time}</p>
        </div>
    )
}
