/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, Grid, GridItem, ModalVariant, Text } from '@patternfly/react-core'
import { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from '../../../../../lib/acm-i18next'
import { AcmButton, AcmExpandableSection, AcmModal } from '../../../../../ui-components'
import MainIcon from './OnboardingModalIcon.svg'
import { ImportIcon, CloudTenantIcon, ConnectedIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { NavigationPath } from '../../../../../NavigationPath'
import './OnboardingModal.css'
import { launchToOCP } from '../../../../../lib/ocp-utils'
import { PluginContext } from '../../../../../lib/PluginContext'
import { DOC_HOME } from '../../../../../lib/doc-util'

export interface IOnboardingModalProps {
  close: () => void
  open: boolean
}

export function OnboardingModal(props: IOnboardingModalProps) {
  const { t } = useTranslation()
  const { isACMAvailable } = useContext(PluginContext)

  const cards = useMemo(
    () => [
      {
        id: 'onboardingimportbutton',
        icon: <ImportIcon />,
        text: t('Import an existing cluster'),
        link: NavigationPath.importCluster,
        style: {
          paddingLeft: '24px',
        },
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
        style: {
          paddingRight: '24px',
        },
      },
    ],
    [t]
  )
  if (props.open === false) {
    return <></>
  }

  return (
    <AcmModal
      position="top"
      variant={ModalVariant.medium}
      id="clustersOnboardingModal"
      ouiaId="clustersOnboardingModal"
      isOpen={true}
      onClose={props.close}
      className="onboarding-modal-class"
      style={{ padding: '0px' }}
    >
      <Grid style={{ padding: '24px' }}>
        <GridItem span={3}>
          <MainIcon />
        </GridItem>
        <GridItem span={9}>
          <div>
            <span className="pf-u-color-100" style={{ fontSize: '24px' }}>
              <Trans i18nKey="Managing clusters <bold>just got easier</bold>" components={{ bold: <strong /> }} />
            </span>
          </div>
          <div className="pf-u-color-400" style={{ fontSize: '14px', paddingTop: '8px' }}>
            <Text>{t('Create and manage a fleet of clusters with ease using this all clusters view. ')}</Text>
            <Text>{t('To access a single cluster you can select it from the cluster list table.')}</Text>
          </div>
          <div className="pf-u-color-100" style={{ fontSize: '16px', paddingTop: '1em' }}>
            {t('How would you like to create your cluster?')}
          </div>
        </GridItem>
      </Grid>
      <Grid hasGutter>
        {cards.map((card) => (
          <GridItem key={card.id} span={4} style={card.style}>
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
        <GridItem style={{ backgroundColor: 'var(--pf-global--BackgroundColor--200)' }}>
          <div className="onboarding-modal-footer">
            <AcmExpandableSection
              label={t('Want to learn more?')}
              style={{
                width: '100%',
                height: '100%',
                paddingLeft: '24px',
                paddingTop: '10px',
                paddingBottom: '10px',
              }}
            >
              <ul style={{ padding: 0, listStyleType: 'none' }}>
                <li>
                  <Link
                    key="gettingstarted"
                    to={`${NavigationPath.managedClusters}?quickstart=host-inventory`}
                    onClick={() => {
                      props.close()
                    }}
                    style={{
                      marginBottom: '0.5em',
                    }}
                  >
                    {t('Get started with on-premise host inventory')}
                  </Link>
                </li>
                <li>
                  <AcmButton
                    variant="link"
                    icon={<ExternalLinkAltIcon className="pf-u-font-size-xs" style={{ padding: '0.5px' }} />}
                    iconPosition="right"
                    isInline
                    onClick={() =>
                      !isACMAvailable
                        ? launchToOCP(
                            'operatorhub/all-namespaces?details-item=advanced-cluster-management-redhat-operators-openshift-marketplace'
                          )
                        : window.open(DOC_HOME, '_blank')
                    }
                  >
                    {t('Learn more about Red Hat Advanced Cluster Management for Kubernetes')}
                  </AcmButton>
                </li>
              </ul>
            </AcmExpandableSection>
          </div>
        </GridItem>
      </Grid>
    </AcmModal>
  )
}
