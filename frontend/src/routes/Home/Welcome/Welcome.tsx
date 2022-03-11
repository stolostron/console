/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardTitle, Page, PageSection, Stack, Text, Title } from '@patternfly/react-core'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AcmDynamicGrid } from '../../../components/AcmDynamicGrid'
import { NavigationPath } from '../../../NavigationPath'
import OverviewIcon from './graphics/welcome-card-1-icon.svg'
import InfrastructureIcon from './graphics/welcome-card-2-icon.svg'
import ApplicationsIcon from './graphics/welcome-card-3-icon.svg'
import GovernanceIcon from './graphics/welcome-card-4-icon.svg'
import NetworkingIcon from './graphics/welcome-card-5-icon.svg'
import CommunityIcon from './graphics/welcome-community-icon.svg'
import HeaderGraphic from './graphics/Welcome-page-header.png'
import SupportIcon from './graphics/welcome-support-icon.svg'

export default function WelcomePage() {
    const cards = useMemo(
        () => [
            {
                icon: <OverviewIcon />,
                title: 'Overview',
                description:
                    'View system alerts, critical application metrics, and overall system health. Search, identify, and resolve issues that are impacting distributed workloads using an operational dashboard designed for Site Reliability Engineers (SREs).',
                link: NavigationPath.overview,
            },
            {
                icon: <InfrastructureIcon />,
                title: 'Clusters',
                description:
                    'Create, update, scale, and remove clusters reliably, consistently using an open source programming model that supports and encourages Infrastructure as Code best practices and design principles.',
                link: NavigationPath.clusters,
            },
            {
                icon: <ApplicationsIcon />,
                title: 'Applications',
                description:
                    'Define a business application using open standards and deploy the applications using placement policies that are integrated into existing CI/CD pipelines and governance controls.',
                link: NavigationPath.applications,
            },
            {
                icon: <GovernanceIcon />,
                title: 'Governance',
                description:
                    'Use policies to automatically configure and maintain consistency of security controls required by industry or other corporate standards. Prevent unintentional or malicious configuration drift that might expose unwanted and unnecessary threat vectors.',
                link: NavigationPath.governance,
            },
            {
                icon: <NetworkingIcon />,
                title: 'Multicluster networking',
                description:
                    'Enable direct networking connection between different on-premises or cloud-hosted Kubernetes clusters by grouping them in cluster sets and enabling the Submariner add-on.',
                link: NavigationPath.clusterSets,
            },
        ],
        []
    )

    const capabilities = useMemo(
        () => [
            {
                title: 'Kubernetes',
                description:
                    'Easily provision Kubernetes clusters and offer complete cluster lifecycle management in a single console.',
            },
            {
                title: 'Policies',
                description:
                    'Enforce policies at the target clusters using Kubernetes-supported custom resource definitions.',
            },
            {
                title: 'Cluster landscape',
                description:
                    'Deploy and maintain day two operations of applications distributed across your cluster landscape.',
            },
            {
                title: 'Range of environments',
                description:
                    'Work across a range of environments, including multiple data centers, and private and public clouds.',
            },
            {
                title: 'Application topology',
                description:
                    'Quickly view service endpoints, pods, and dependant resources that comprise your application topology.',
            },
            {
                title: 'Cluster labels and placement rules',
                description:
                    'Use cluster labels and application placement rules to easily move workloads across clusters, even between multiple cloud providers.',
            },
        ],
        []
    )

    const connections = useMemo(
        () => [
            {
                icon: <CommunityIcon />,
                title: 'Technical community',
                description: 'Want more information? Check out the developer community.',
                link: 'https://www.redhat.com/en/blog/products',
            },
            // {
            //     icon: <SlackIcon />,
            //     title: 'Slack channel',
            //     description: 'Join our Slack community to connect and chat with us.',
            // },
            {
                icon: <SupportIcon />,
                title: 'Support center',
                description: 'Need technical support? Contact us.',
                link: 'https://access.redhat.com/support',
            },
        ],
        []
    )

    return (
        <Page>
            <PageSection
                variant="darker"
                style={{ backgroundColor: '#333', backgroundImage: 'linear-gradient(to right, #333, #111)' }}
            >
                <div style={{ display: 'flex', gap: 64 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32 }}>
                        <Title headingLevel="h1">Welcome! &nbsp; Let’s get started.</Title>
                        <Text>
                            Red Hat Advanced Cluster Management for Kubernetes provides the tools and capabilities to
                            address various challenges with managing multiple clusters and consoles, distributed
                            business applications, and inconsistent security controls across Kubernetes clusters that
                            are deployed on-premises, or across public clouds.
                        </Text>
                    </div>
                    <img src={HeaderGraphic} style={{ height: '180px', paddingRight: 32 }} />
                </div>
            </PageSection>
            <PageSection variant="default">
                <AcmDynamicGrid minSize={600}>
                    {cards.map((card) => (
                        <Link to={card.link} style={{ color: 'black', textDecoration: 'none' }}>
                            <Card
                                isRounded
                                isLarge
                                isHoverable
                                isFullHeight
                                key={card.title}
                                style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
                            >
                                <CardTitle>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                        {card.icon}
                                        {card.title}
                                    </div>
                                </CardTitle>
                                <CardBody>{card.description}</CardBody>
                            </Card>
                        </Link>
                    ))}
                </AcmDynamicGrid>
            </PageSection>
            <PageSection variant="light">
                <Stack hasGutter>
                    <Title headingLevel="h2">Easy, simple, and secure.</Title>
                    <Text>
                        Easy to use and simple to understand, Red Hat Advanced Cluster Management for Kubernetes
                        provides the following mission critical capabilities based on open source projects:
                    </Text>
                    <div style={{ paddingTop: 16 }}>
                        <AcmDynamicGrid minSize={400}>
                            {capabilities.map((card) => (
                                <Card isRounded isFlat isFullHeight key={card.title}>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardBody>{card.description}</CardBody>
                                </Card>
                            ))}
                        </AcmDynamicGrid>
                    </div>
                </Stack>
            </PageSection>
            <PageSection variant="default">
                <Stack hasGutter>
                    <Title headingLevel="h2">Converse and connect.</Title>
                    <AcmDynamicGrid minSize={400}>
                        {connections.map((card) => (
                            <a href={card.link} target="_blank" style={{ color: 'black', textDecoration: 'none' }}>
                                <Card
                                    isRounded
                                    isHoverable
                                    isFullHeight
                                    key={card.title}
                                    style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
                                >
                                    <CardTitle>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            {card.icon}
                                            {card.title}
                                        </div>
                                    </CardTitle>
                                    <CardBody>{card.description}</CardBody>
                                </Card>
                            </a>
                        ))}
                    </AcmDynamicGrid>
                </Stack>
            </PageSection>
        </Page>
    )
}
