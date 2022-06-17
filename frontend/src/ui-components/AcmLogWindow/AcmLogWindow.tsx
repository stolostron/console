/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { SelectOption } from '@patternfly/react-core'
import { useState } from 'react'
import { AcmSelect } from '../AcmSelect/AcmSelect'

type AcmLogWindowProps = {
    id: string
    cluster: string
    namespace: string
    initialContainer: string
    // Callback to get new container to query logs from
    onSwitchContainer: (newContainer: string | undefined) => void
    containers: string[]
    // A single string that contains \n for each new log line
    logs: string
}

const useStyles = makeStyles({
    containerSelect: {
        width: 'auto',
        'min-width': 'min-content',
        'max-width': 'max-content',
    },
    logWindow: {
        color: 'var(--pf-global--palette--black-150)',
        backgroundColor: 'var(--pf-global--palette--black-1000)',
    },
    logWindowHeader: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--pf-global--palette--black-900)',
        marginTop: '1rem',
    },
    logWindowHeaderItem: {
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        backgroundColor: 'var(--pf-global--palette--black-900)',
        padding: '8px 10px 5px 10px',
        borderRight: '1px solid #4f5255',
    },
    logWindowHeaderItemLabel: {
        paddingRight: '.5rem',
    },
    logWindowBody: {
        backgroundColor: 'var(--pf-global--palette--black-1000)',
        fontFamily: 'Menlo,Monaco,Consolas,monospace',
    },
    logWindowScrollPane: {
        overflow: 'auto',
        paddingTop: '10px',
    },
    logWindowContents: {
        height: '500px',
    },
    logWindowLines: {
        paddingLeft: '10px',
        paddingRight: '10px',
        whiteSpace: 'pre',
        width: 0,
    },
})

export function AcmLogWindow(props: AcmLogWindowProps) {
    const { cluster, namespace, initialContainer, containers, onSwitchContainer, logs } = props
    const classes = useStyles(props)
    const [selectedContainer, setSelectedContainer] = useState<string | undefined>(initialContainer)

    return (
        <div>
            <AcmSelect
                id={'container-select'}
                label={''}
                className={classes.containerSelect}
                value={selectedContainer}
                onChange={(value) => {
                    setSelectedContainer(value)
                    onSwitchContainer(value)
                }}
            >
                {containers.map((container) => {
                    return (
                        <SelectOption key={container} value={container}>
                            {container}
                        </SelectOption>
                    )
                })}
            </AcmSelect>
            <div className={classes.logWindow}>
                <div className={classes.logWindowHeader}>
                    <div className={classes.logWindowHeaderItem}>
                        <p className={classes.logWindowHeaderItemLabel}>{'Cluster:'}</p>
                        {cluster}
                    </div>
                    <div className={classes.logWindowHeaderItem}>
                        <p className={classes.logWindowHeaderItemLabel}>{'Namespace:'}</p>
                        {namespace}
                    </div>
                </div>
                <div className={classes.logWindowBody}>
                    <div className={classes.logWindowScrollPane}>
                        <div className={classes.logWindowContents}>
                            <div id={'log-window-lines-container'} className={classes.logWindowLines}>
                                {logs}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
