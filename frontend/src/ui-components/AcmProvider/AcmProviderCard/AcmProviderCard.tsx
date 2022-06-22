/* Copyright Contributors to the Open Cluster Management project */


import {
    Card,
    CardHeaderMain,
    CardHeader,
    CardFooter,
    Title,
    Text,
    TextVariants,
    Stack,
    StackItem,
    Gallery,
    GalleryItem,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { makeStyles } from '@material-ui/styles'
import { AcmIcon } from '../../AcmIcons/AcmIcons'
import { Provider, ProviderShortTextMap, ProviderIconMap } from '../'

const useStyles = makeStyles({
    icon: {
        '& svg, & img': {
            width: '56px',
            height: '56px',
        },
    },
    providerTitle: {
        marginTop: '4px',
        fontSize: 'var(--pf-c-title--m-3xl--FontSize)',
        lineHeight: 'var(--pf-c-title--m-3xl--LineHeight)',
    },
    dangerIcon: {
        width: '16px',
        height: '16px',
        marginLeft: '8px',
        verticalAlign: 'unset !important',
    },
    clusterCount: {
        fontSize: '28px',
    },
    clusterText: {
        fontSize: '14px',
        fontWeight: 600,
    },
})

type ProviderCardProps = {
    provider: Provider
    clusterCount: number | undefined
    onClick: (provider: string) => void
    danger?: boolean
    isSelected?: boolean
}

export function AcmOverviewProviders(props: { providers: ProviderCardProps[] }) {
    return (
        <Gallery hasGutter>
            {props.providers.map((provider) => (
                <GalleryItem key={provider.provider}>
                    <AcmProviderCard {...provider} />
                </GalleryItem>
            ))}
        </Gallery>
    )
}

export function AcmProviderCard(props: ProviderCardProps) {
    const classes = useStyles()
    return (
        <Card
            onClick={() => props.onClick(props.provider)}
            onKeyDown={(event: React.KeyboardEvent) =>
                [13, 32].includes(event.keyCode) && props.onClick(props.provider)
            }
            isSelectable
            isSelected={props.isSelected}
            id={`${props.provider}-provider-card`}
        >
            <Stack>
                <StackItem>
                    <CardHeader>
                        <CardHeaderMain>
                            <div className={classes.icon}>
                                <AcmIcon icon={ProviderIconMap[props.provider]} />
                            </div>
                            <Title
                                headingLevel="h2"
                                size="3xl"
                                className={classes.providerTitle}
                                style={{ fontWeight: 300 }}
                            >
                                {ProviderShortTextMap[props.provider]}
                                {props.danger && (
                                    <ExclamationCircleIcon
                                        color="var(--pf-global--palette--red-100)"
                                        className={`${classes.dangerIcon} danger-icon`}
                                    />
                                )}
                            </Title>
                        </CardHeaderMain>
                    </CardHeader>
                </StackItem>
                <StackItem isFilled></StackItem>
                <StackItem>
                    <CardFooter>
                        <Text component={TextVariants.p} className={classes.clusterCount}>
                            {props.clusterCount}
                        </Text>
                        <Text component={TextVariants.p} className={classes.clusterText}>
                            {props.clusterCount === 1 ? 'Cluster' : 'Clusters'}
                        </Text>
                    </CardFooter>
                </StackItem>
            </Stack>
        </Card>
    )
}
