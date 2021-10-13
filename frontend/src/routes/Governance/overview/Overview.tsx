/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardHeader, CardTitle, Divider, PageSection, Stack, Text, Title } from '@patternfly/react-core'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import { AcmFlewWrap, PolicyRiskLabels, RisksCard, RisksGauge } from '../components/PolicyRiskLabels'
import { IGovernanceData } from '../useGovernanceData'

export default function GovernanceOverview(props: { governanceData: IGovernanceData }) {
    const { governanceData } = props
    const [activeTab, setActiveTab] = useState(0)
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

                <AcmFlewWrap>
                    <Link to={NavigationPath.policies}>
                        <RisksCard
                            title="Policies"
                            risks={governanceData.policyRisks}
                            singular="policy"
                            plural="policies"
                        />
                    </Link>
                    <Link to={NavigationPath.clusters}>
                        <RisksCard
                            title="Clusters"
                            risks={governanceData.clusterRisks}
                            singular="cluster"
                            plural="clusters"
                        />
                    </Link>
                </AcmFlewWrap>

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
                <div>
                    <AcmFlewWrap>
                        {governanceData.categories.groups.map((category) => {
                            return (
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
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
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
                                            {/* <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                            <RisksGauge risks={category.policyRisks} />
                                            <div style={{ alignSelf: 'center' }}>
                                                <PolicyRiskLabels
                                                    risks={category.clusterRisks}
                                                    isVertical
                                                    showLabels
                                                    singular={'cluster'}
                                                    plural={'clusters'}
                                                />
                                            </div>
                                        </div> */}
                                        </Stack>
                                    </CardBody>
                                </Card>
                            )
                        })}
                    </AcmFlewWrap>
                </div>

                <div />
                <Stack>
                    <Title headingLevel="h3">Standards</Title>
                    <Text>
                        The name or names of security standards the policy is related to. For example, National
                        Institute of Standards and Technology (NIST) and Payment Card Industry (PCI).
                    </Text>
                </Stack>
                <div>
                    <AcmFlewWrap>
                        {governanceData.standards.groups.map((category) => {
                            return (
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
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
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
                                            {/* <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                            <RisksGauge risks={category.policyRisks} />
                                            <div style={{ alignSelf: 'center' }}>
                                                <PolicyRiskLabels
                                                    risks={category.clusterRisks}
                                                    isVertical
                                                    showLabels
                                                    singular={'cluster'}
                                                    plural={'clusters'}
                                                />
                                            </div>
                                        </div> */}
                                        </Stack>
                                    </CardBody>
                                </Card>
                            )
                        })}
                    </AcmFlewWrap>
                </div>

                <div />
                <Stack>
                    <Title headingLevel="h3">Controls</Title>
                    <Text>
                        The name of the security control that is being checked. For example, the certificate policy
                        controller.
                    </Text>
                </Stack>

                <div>
                    <AcmFlewWrap>
                        {governanceData.controls.groups.map((category) => {
                            return (
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
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
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
                                            {/* <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                            <RisksGauge risks={category.policyRisks} />
                                            <div style={{ alignSelf: 'center' }}>
                                                <PolicyRiskLabels
                                                    risks={category.clusterRisks}
                                                    isVertical
                                                    showLabels
                                                    singular={'cluster'}
                                                    plural={'clusters'}
                                                />
                                            </div>
                                        </div> */}
                                        </Stack>
                                    </CardBody>
                                </Card>
                            )
                        })}
                    </AcmFlewWrap>
                </div>

                {/* <Card>
                    <Tabs activeKey={activeTab} onSelect={(_event, tabIndex) => setActiveTab(tabIndex as number)}>
                        <Tab eventKey={0} title={<TabTitleText>Categories</TabTitleText>}>
                            <PolicyGrouping policyGrouping={governanceData.categories} title="Categories" />
                        </Tab>
                        <Tab eventKey={1} title={<TabTitleText>Standards</TabTitleText>}>
                            <PolicyGrouping policyGrouping={governanceData.standards} title="Standards" />
                        </Tab>
                        <Tab eventKey={2} title={<TabTitleText>Controls</TabTitleText>}>
                            <PolicyGrouping policyGrouping={governanceData.controls} title="Controls" />
                        </Tab>
                    </Tabs>
                </Card> */}
            </Stack>
        </PageSection>
    )
}
