/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardHeader, CardTitle, Divider, PageSection, Stack, Text, Title } from '@patternfly/react-core'
import { Link } from 'react-router-dom'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { NavigationPath } from '../../../NavigationPath'
import { PolicyRiskLabels, RisksCard, RisksGauge } from '../components/PolicyRiskLabels'
import { IGovernanceData } from '../useGovernanceData'

export default function GovernanceOverview(props: { governanceData: IGovernanceData }) {
    const { governanceData } = props
    return (
        <PageSection>
            <Stack hasGutter>
                <Text>
                    Enterprises must meet internal standards for software engineering, secure engineering, resiliency,
                    security, and regulatory compliance for workloads hosted on private, multi and hybrid clouds. Red
                    Hat Advanced Cluster Management for Kubernetes governance provides an extensible policy framework
                    for enterprises to introduce their own security policies.
                </Text>

                <div />
                <Stack>
                    <Title headingLevel="h3">Summary</Title>
                </Stack>

                <AcmMasonry>
                    <div>
                        <Link to={NavigationPath.policies}>
                            <RisksCard
                                title="Policies"
                                risks={governanceData.policyRisks}
                                singular="policy"
                                plural="policies"
                            />
                        </Link>
                    </div>
                    <div>
                        <Link to={NavigationPath.clusters}>
                            <RisksCard
                                title="Clusters"
                                risks={governanceData.clusterRisks}
                                singular="cluster"
                                plural="clusters"
                            />
                        </Link>
                    </div>
                </AcmMasonry>

                <div />
                <Stack>
                    <Title headingLevel="h3">Categories</Title>
                    <Text>
                        A security control category represent specific requirements for one or more standards. For
                        example, a System and Information Integrity category might indicate that your policy contains a
                        data transfer protocol to protect personal information, as required by the HIPAA and PCI
                        standards.
                    </Text>
                </Stack>
                <AcmMasonry>
                    {governanceData.categories.groups.map((category) => {
                        return (
                            <div>
                                <Card
                                    isRounded
                                    isHoverable
                                    style={{ transition: 'box-shadow 0.25s', cursor: 'pointer', height: '100%' }}
                                >
                                    <CardHeader>
                                        <CardTitle>
                                            <Title headingLevel="h3" style={{ color: 'black' }}>
                                                {category.name}
                                            </Title>
                                        </CardTitle>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody>
                                        <Stack hasGutter>
                                            <div style={{ display: 'flex', gap: '24px', alignItems: 'start' }}>
                                                <RisksGauge risks={category.policyRisks} />
                                                <div style={{ alignSelf: 'center' }}>
                                                    <PolicyRiskLabels
                                                        risks={category.policyRisks}
                                                        isVertical
                                                        showLabels
                                                        singular={'policy'}
                                                        plural={'policies'}
                                                    />
                                                </div>
                                            </div>
                                        </Stack>
                                    </CardBody>
                                </Card>
                            </div>
                        )
                    })}
                </AcmMasonry>

                <div />
                <Stack>
                    <Title headingLevel="h3">Standards</Title>
                    <Text>
                        The name or names of security standards the policy is related to. For example, National
                        Institute of Standards and Technology (NIST) and Payment Card Industry (PCI).
                    </Text>
                </Stack>
                <AcmMasonry>
                    {governanceData.standards.groups.map((category) => {
                        return (
                            <div>
                                <Card
                                    isRounded
                                    isHoverable
                                    style={{ transition: 'box-shadow 0.25s', cursor: 'pointer', height: '100%' }}
                                >
                                    <CardHeader>
                                        <CardTitle>
                                            <Title headingLevel="h3" style={{ color: 'black' }}>
                                                {category.name}
                                            </Title>
                                        </CardTitle>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody>
                                        <Stack hasGutter>
                                            <div style={{ display: 'flex', gap: '24px', alignItems: 'start' }}>
                                                <RisksGauge risks={category.policyRisks} />
                                                <div style={{ alignSelf: 'center' }}>
                                                    <PolicyRiskLabels
                                                        risks={category.policyRisks}
                                                        isVertical
                                                        showLabels
                                                        singular={'policy'}
                                                        plural={'policies'}
                                                    />
                                                </div>
                                            </div>
                                        </Stack>
                                    </CardBody>
                                </Card>
                            </div>
                        )
                    })}
                </AcmMasonry>

                <div />
                <Stack>
                    <Title headingLevel="h3">Controls</Title>
                    <Text>
                        The name of the security control that is being checked. For example, the certificate policy
                        controller.
                    </Text>
                </Stack>

                <AcmMasonry>
                    {governanceData.controls.groups.map((category) => {
                        return (
                            <div>
                                <Card
                                    isRounded
                                    isHoverable
                                    style={{ transition: 'box-shadow 0.25s', cursor: 'pointer', height: '100%' }}
                                >
                                    <CardHeader>
                                        <CardTitle>
                                            <Title headingLevel="h3" style={{ color: 'black' }}>
                                                {category.name}
                                            </Title>
                                        </CardTitle>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody>
                                        <Stack hasGutter>
                                            <div style={{ display: 'flex', gap: '24px', alignItems: 'start' }}>
                                                <RisksGauge risks={category.policyRisks} />
                                                <div style={{ alignSelf: 'center' }}>
                                                    <PolicyRiskLabels
                                                        risks={category.policyRisks}
                                                        isVertical
                                                        showLabels
                                                        singular={'policy'}
                                                        plural={'policies'}
                                                    />
                                                </div>
                                            </div>
                                        </Stack>
                                    </CardBody>
                                </Card>
                            </div>
                        )
                    })}
                </AcmMasonry>
            </Stack>
        </PageSection>
    )
}
