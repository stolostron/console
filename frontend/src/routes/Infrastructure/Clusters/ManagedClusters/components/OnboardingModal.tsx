/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, Grid, GridItem, ModalVariant, TextVariants, Text } from '@patternfly/react-core'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from '../../../../../lib/acm-i18next'
import { AcmExpandableSection, AcmModal } from '../../../../../ui-components'
import MainIcon from './OnboardingModalIcon.svg'
import { ImportIcon, CloudTenantIcon, ConnectedIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { NavigationPath } from '../../../../../NavigationPath'
import './OnboardingModal.css'
import { launchToOCP } from '../../../../../lib/ocp-utils'

export interface IOnboardingModalProps {
    close: () => void
    open: boolean
}

export function OnboardingModal(props: IOnboardingModalProps) {
    const { t } = useTranslation()

    const cards = useMemo(
        () => [
            {
                id: 'onboardingimportbutton',
                icon: <ImportIcon />,
                text: t('Import an existing cluster'),
                link: NavigationPath.importCluster,
            },
            {
                id: 'onboardingconnectbutton',
                icon: <CloudTenantIcon />,
                text: t('Connect your cloud provider'),
                link: NavigationPath.addCredentials,
            },
            {
                id: 'onboardingdiscoverbutton',
                icon: <ConnectedIcon />,
                text: t('Discover hosts to create host inventory'),
                link: NavigationPath.infraEnvironments,
            },
        ],
        [t]
    )
    if (props.open === false) {
        return <></>
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title=" "
            id="clustersOnboardingModal"
            ouiaId="clustersOnboardingModal"
            isOpen={true}
            onClose={props.close}
            className="onboardingmodalclass"
            footer={
                <AcmExpandableSection
                    label={t('Want to learn more?')}
                    style={{
                        width: '100%',
                        height: '100%',
                        padding: '16px 16px 16px 36px',
                    }}
                >
                    <div>
                        <Link key="gettingstarted" to={`${NavigationPath.managedClusters}?quickstart=host-inventory`}>
                            {t('Getting Started with on-premise host inventory')}
                        </Link>
                    </div>
                    <div>
                        <Text
                            component={TextVariants.a}
                            isVisitedLink
                            onClick={() =>
                                launchToOCP(
                                    'operatorhub/all-namespaces?details-item=advanced-cluster-management-redhat-operators-openshift-marketplace',
                                    true
                                )
                            }
                            style={{
                                cursor: 'pointer',
                                display: 'inline-block',
                            }}
                        >
                            {t('Learn more about Red Hat Advanced Cluster Management for Kubernetes')}{' '}
                            <ExternalLinkAltIcon />
                        </Text>
                    </div>
                </AcmExpandableSection>
            }
        >
            <Grid>
                <GridItem span={3}>
                    <MainIcon />
                </GridItem>
                <GridItem span={9}>
                    <div>
                        <span className="pf-u-color-100" style={{ fontSize: '24px' }}>
                            <Trans
                                i18nKey="Managing clusters <bold>just got easier</bold>"
                                components={{ bold: <strong /> }}
                            />
                        </span>
                    </div>
                    <div className="pf-u-color-400" style={{ fontSize: '14px', paddingTop: '8px' }}>
                        {t(
                            'Create and manage a fleet of clusters with ease using this all clusters view. To access a single cluster you can select it from the cluster list table.'
                        )}
                    </div>
                    <div className="pf-u-color-100" style={{ fontSize: '16px', paddingTop: '48px' }}>
                        {t('How would you like to create your cluster?')}
                    </div>
                </GridItem>
            </Grid>
            <div style={{ paddingTop: '24px' }} />
            <Grid hasGutter>
                {cards.map((card) => (
                    <GridItem key={card.id} span={4}>
                        <Link key={card.id} to={card.link} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <Card id={card.id} key={card.id} isSelectable isFlat>
                                <CardBody style={{ minHeight: '160px' }}>
                                    <div
                                        className="pf-u-color-100"
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        <div style={{ textAlign: 'center' }}>{card.icon}</div>
                                        <div style={{ textAlign: 'center' }}>{card.text}</div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Link>
                    </GridItem>
                ))}
            </Grid>
            <div style={{ paddingTop: '24px' }} />
        </AcmModal>
    )
}
