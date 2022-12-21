/* Copyright Contributors to the Open Cluster Management project */

import { Fragment } from 'react'
import { Flex, FlexItem, Divider } from '@patternfly/react-core'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles({
    group: {
        '& > div > a, & .pf-c-dropdown__toggle.pf-m-plain': {
            paddingLeft: 0,
            paddingRight: 0,
        },
    },
})

export function AcmActionGroup(props: { children: React.ReactNode[] }) {
    const classes = useStyles()

    return (
        <Flex className={classes.group}>
            {props.children
                .filter((child) => !!child)
                .map((child, i) => {
                    if (i === 0) {
                        return <FlexItem key={i}>{child}</FlexItem>
                    } else {
                        return (
                            <Fragment key={i}>
                                <Divider isVertical />
                                <FlexItem>{child}</FlexItem>
                            </Fragment>
                        )
                    }
                })}
        </Flex>
    )
}
