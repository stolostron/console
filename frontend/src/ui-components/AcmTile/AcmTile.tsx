/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { Skeleton, Tile, TileProps } from '@patternfly/react-core'

type AcmTileProps = TileProps & {
    loading?: boolean
    relatedResourceData?: {
        count: number
        kind: string
    }
}

const useStyles = makeStyles({
    tileRoot: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        height: '64px',
        overflow: 'hidden',
        '& >div:last-child': {
            width: '100%',
        },
    },
    relatedResourceContainer: {
        display: 'flex',
        alignItems: 'center',
    },
    relatedResourceCount: {
        fontSize: '28px',
        color: 'var(--pf-global--palette--blue-400)',
        marginRight: '.5rem',
    },
    relatedResourceKind: {
        fontSize: '14px',
        fontWeight: 'bold',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'left',
        lineHeight: '18px',
    },
})

export function AcmTile(props: AcmTileProps) {
    const classes = useStyles(props)
    if (props.loading) {
        return (
            <Tile className={classes.tileRoot} title={''} ref={null}>
                <Skeleton />
            </Tile>
        )
    }
    if (props.relatedResourceData) {
        // This render is specific to the search related resources tile
        let count = `${props.relatedResourceData.count}`
        if (parseInt(count) >= 1000) {
            count = `${(parseInt(count) - (parseInt(count) % 100)) / 1000}k`
        }
        return (
            <Tile
                className={classes.tileRoot}
                title={props.title}
                onClick={props.onClick}
                isSelected={props.isSelected}
                ref={null}
            >
                <div className={classes.relatedResourceContainer}>
                    <div className={classes.relatedResourceCount}>{count}</div>
                    <div className={classes.relatedResourceKind}>{props.relatedResourceData.kind}</div>
                </div>
            </Tile>
        )
    }
    return <Tile {...props} ref={null} />
}
