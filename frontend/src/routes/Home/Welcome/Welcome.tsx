/* Copyright Contributors to the Open Cluster Management project */
import { AcmPage } from '@open-cluster-management/ui-components'
import { Card, CardBody, CardTitle, PageSection, Stack, Text, Title } from '@patternfly/react-core'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { NavigationPath } from '../../../NavigationPath'

export default function WelcomePage() {
    const cards = useMemo(
        () => [
            {
                title: 'End-to-end visibility',
                description:
                    'Go to Overview View system alerts, critical application metrics, and overall system health. Search, identify, and resolve issues that are impacting distributed workloads using an operational dashboard designed for Site Reliability Engineers (SREs).',
                link: NavigationPath.overview,
            },
            {
                title: 'Cluster lifecycle',
                description:
                    'Create, update, scale, and remove clusters reliably, consistently using an open source programming model that supports and encourages Infrastructure as Code best practices and design principles.',
                link: NavigationPath.clusters,
            },
            {
                title: 'Application lifecycle',
                description:
                    'Define a business application using open standards and deploy the applications using placement policies that are integrated into existing CI/CD pipelines and governance controls.',
                link: NavigationPath.applications,
            },
            {
                title: 'Governance, Risk, and Compliance',
                description:
                    'Use policies to automatically configure and maintain consistency of security controls required by industry or other corporate standards. Prevent unintentional or malicious configuration drift that might expose unwanted and unnecessary threat vectors.',
                link: NavigationPath.governance,
            },
            {
                title: 'Multicluster networking',
                description:
                    'Enable direct networking connection between different on-premises or cloud-hosted Kubernetes clusters by grouping them in cluster sets and enabling the Submariner add-on.',
                link: NavigationPath.overview,
            },
        ],
        []
    )

    const details = useMemo(
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
                title: 'Technical community',
                description: 'Want more information? Check out the developer community.',
            },
            {
                title: 'Slack channel',
                description: 'Join our Slack community to connect and chat with us.',
            },
            {
                title: 'Support center',
                description: 'Need technical support? Contact us.',
            },
        ],
        []
    )

    return (
        <AcmPage>
            <PageSection variant="light">
                <Stack hasGutter>
                    <Title headingLevel="h1">Welcome! &nbsp; Let’s get started.</Title>
                    <Text>
                        Red Hat Advanced Cluster Management for Kubernetes provides the tools and capabilities to
                        address various challenges with managing multiple clusters and consoles, distributed business
                        applications, and inconsistent security controls across Kubernetes clusters that are deployed
                        on-premises, or across public clouds.
                    </Text>
                </Stack>
            </PageSection>
            <PageSection variant="default">
                <AcmMasonry minSize={1000}>
                    {cards.map((card) => (
                        <div>
                            <Link to={card.link} style={{ color: 'black' }}>
                                <Card isRounded isLarge isHoverable>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardBody>{card.description}</CardBody>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </AcmMasonry>
            </PageSection>
            <PageSection variant="light">
                <Stack hasGutter>
                    <Title headingLevel="h1">Easy, simple, and secure.</Title>
                    <Text>
                        Easy to use and simple to understand, Red Hat Advanced Cluster Management for Kubernetes
                        provides the following mission critical capabilities based on open source projects:
                    </Text>
                    <AcmMasonry minSize={400}>
                        {details.map((card) => (
                            <Card isRounded isFlat>
                                <CardTitle>{card.title}</CardTitle>
                                <CardBody>{card.description}</CardBody>
                            </Card>
                        ))}
                    </AcmMasonry>
                </Stack>
            </PageSection>
            <PageSection variant="default">
                <Stack hasGutter>
                    <Title headingLevel="h1">Converse and connect.</Title>
                    <AcmMasonry minSize={400}>
                        {connections.map((card) => (
                            <Card isRounded isHoverable>
                                <CardTitle>{card.title}</CardTitle>
                                <CardBody>{card.description}</CardBody>
                            </Card>
                        ))}
                    </AcmMasonry>
                </Stack>
            </PageSection>
        </AcmPage>
    )
}
