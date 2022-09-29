/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    Card,
    CardBody,
    CardTitle,
    Divider,
    Flex,
    FlexItem,
    Skeleton,
    Split,
    SplitItem,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import { Link } from 'react-router-dom'

const useStyles = makeStyles({
    rightSplit: { alignSelf: 'center', paddingRight: '12px' },
    cardBody: { borderTop: '1px solid rgba(0,0,0,0.1)' },
    divider: { marginBottom: '6px' },
})

type AcmSummaryListProps = {
    title: string
    list: SummarySectionProps[]
    loading?: boolean
}

export const SkeletonWrapper = (title: string) => {
    const classes = useStyles()
    return (
        <Card>
            <Flex>
                <FlexItem>
                    <CardTitle>{title}</CardTitle>
                </FlexItem>
            </Flex>
            <Divider />

            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <FlexItem key={i}>
                        <Card>
                            <CardBody>
                                <Skeleton width="50px" fontSize="3xl" className={classes.divider} />
                                <Skeleton width="100px" fontSize="sm" />
                            </CardBody>
                        </Card>
                    </FlexItem>
                ))}
            </Flex>
        </Card>
    )
}

export function AcmSummaryList(props: AcmSummaryListProps) {
    const classes = useStyles()

    if (props.loading) return SkeletonWrapper(props.title)
    return (
        <Card>
            <Split>
                <SplitItem>
                    <Flex>
                        <FlexItem>
                            <CardTitle>{props.title}</CardTitle>
                        </FlexItem>
                    </Flex>
                </SplitItem>
            </Split>
            <div className={classes.cardBody}>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    {props.list.map((item) => (
                        <FlexItem key={item.description} span={3}>
                            <SummarySection {...item} />
                        </FlexItem>
                    ))}
                </Flex>
            </div>
        </Card>
    )
}

const useSectionStyles = makeStyles({
    card: {
        border: 'none !important',
        height: '100%',
        maxWidth: '185px',
        minWidth: '130px',
    },
    cardBody: {
        paddingLeft: '34px',
    },
    cardFooter: {
        height: '100%',
    },
    count: {
        fontSize: '28px',
        '& a': {
            textDecoration: 'none !important',
            fontColor: 'var(--pf-global--Color--100) !important',
        },
    },
    description: {
        fontSize: '14px',
        fontWeight: 600,
    },
    divider: { marginBottom: '6px' },
})

type SummarySectionProps = {
    count: number
    description: string
    href?: string
    isLoading?: boolean
}

const SummarySection = (props: SummarySectionProps) => {
    const classes = useSectionStyles(props)
    return (
        <Card
            component="div"
            className={classes.card}
            isFlat
            id={`${props.description.toLowerCase().replace(/\s+/g, '-')}-summary`}
        >
            {props.isLoading ? (
                <CardBody className={classes.cardBody}>
                    <Skeleton
                        id={`loading-${props.description}`}
                        width="50px"
                        fontSize="3xl"
                        className={classes.divider}
                    />
                    <Skeleton width="100px" fontSize="sm" />
                </CardBody>
            ) : (
                <CardBody className={classes.cardBody}>
                    <Text component={TextVariants.p} className={classes.count}>
                        {props.href ? <Link to={props.href}>{props.count}</Link> : props.count}
                    </Text>
                    <Text component={TextVariants.p} className={classes.description}>
                        {props.description}
                    </Text>
                </CardBody>
            )}
        </Card>
    )
}
