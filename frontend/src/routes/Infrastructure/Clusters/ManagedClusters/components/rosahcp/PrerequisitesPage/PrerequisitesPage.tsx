/* Copyright Contributors to the Open Cluster Management project */

import React, { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  List,
  ListComponent,
  ListItem,
  PageSection,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'

import { Secret } from '~/resources'

import { AcmExpandableSection, AcmPage, AcmPageHeader } from '../../../../../../../ui-components'
import { Trans, useTranslation } from '../../../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../../../NavigationPath'
import { DOC_LINKS } from '../../../../../../../lib/doc-util'
import { RosaHCPModal } from '../RosaHCPModal/RosaHCPModal'

import { StepDownloadROSAClI } from './StepDownloadROSACLI'
import { WithTerraFormCard } from './WithTerraformCard'
import { WithWizardCard } from './WithWizardCard'
import { WithCLICard } from './WithCLICard'
import { StepCreateAWSAccountRoles } from './StepCreateAwsAccountRoles'
import { StepCreateNetwork } from './StepCreateNetwork'
import { ServiceAccountSteps } from './ServiceAccountSteps'
import ExternalLinkButton from '@patternfly/react-component-groups/dist/dynamic/ExternalLinkButton'

import './Prerequisites.css'

export const productName = 'Red Hat OpenShift Service on AWS'

export const PrerequisitesPage = () => {
  const [t] = useTranslation()
  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs = [
      { text: t('Clusters'), to: NavigationPath.clusters },
      { text: t('Infrastructure'), to: NavigationPath.createCluster },
      { text: t('Control plane type - {{hcType}}', { hcType: 'AWS' }), to: NavigationPath.createAWSControlPlane },
      { text: t('Prerequisites') },
    ]
    return newBreadcrumbs
  }, [t])

  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [selectedSecret, setSelectedSecret] = React.useState<Secret[] | undefined>(undefined)

  const close = () => {
    setSelectedSecret(undefined)
    setModalIsOpen(false)
  }

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('Red Hat OpenShift Service on AWS', { hcType: 'AWS' })}
          description={
            <Stack>
              <StackItem>
                {t(
                  'Deploy fully operational and managed Red Hat OpenShift clusters while leveraging the full breadth and depth of AWS using ROSA.'
                )}
              </StackItem>
              <StackItem>
                <Trans
                  i18nKey="<learnMoreRosaLink>Learn more about ROSA</learnMoreRosaLink> or <slackUsLink>Slack us</slackUsLink>"
                  components={{
                    learnMoreRosaLink: (
                      <ExternalLinkButton isInline target="_blank" variant="link" href={DOC_LINKS.WHAT_IS_ROSA}>
                        {}
                      </ExternalLinkButton>
                    ),
                    slackUsLink: (
                      <ExternalLinkButton isInline target="_blank" variant="link" href={DOC_LINKS.ROSA_COMMUNITY_SLACK}>
                        {}
                      </ExternalLinkButton>
                    ),
                  }}
                />
              </StackItem>
            </Stack>
          }
          breadcrumb={breadcrumbs}
        />
      }
    >
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          {/* ************* Start of RHOCM prerequisites section ************* */}
          <StackItem>
            <AcmExpandableSection label="Service account prerequisites">
              <ServiceAccountSteps />
            </AcmExpandableSection>
          </StackItem>

          {/* ************ Start of AWS prerequisites section ***************** */}

          <StackItem>
            <AcmExpandableSection label="AWS prerequisites">
              <Card>
                <CardTitle>
                  <Title headingLevel="h2">{t('Complete AWS prerequisites')}</Title>
                </CardTitle>
                <CardBody>
                  <Title headingLevel="h3">{t('Have you prepared your AWS account?')}</Title>
                  <Content component={ContentVariants.p}>
                    {t(
                      `Make sure your AWS account is set up for ROSA deployment. If you've already set it up, you can continue to the ROSA prerequisites.`
                    )}
                  </Content>

                  <Grid hasGutter span={10}>
                    <GridItem span={4}>
                      <List component={ListComponent.ul}>
                        <ListItem>{t('Enable AWS')}</ListItem>
                        <ListItem>{t('Configure Elastic Load Balancer (ELB)')}</ListItem>
                      </List>
                    </GridItem>

                    <GridItem span={6}>
                      <List component={ListComponent.ul}>
                        <ListItem>
                          {t(
                            'Set up a VPC for ROSA hosted control plane architecture (HCP) clusters (optional for ROSA classic architecture clusters)'
                          )}
                        </ListItem>
                        <ListItem>{t('Verify your quotas on AWS console')}</ListItem>
                      </List>
                    </GridItem>
                  </Grid>

                  <Button
                    component="a"
                    href={DOC_LINKS.AWS_CONSOLE_ROSA_HOME_GET_STARTED}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('Open AWS Console')}
                  </Button>
                </CardBody>
              </Card>
            </AcmExpandableSection>
          </StackItem>

          {/* ************ Start of ROSA prerequisites section ***************** */}

          <StackItem>
            <AcmExpandableSection label="ROSA prerequisites">
              <Card>
                <CardBody>
                  <Split className="pf-v6-u-mb-lg">
                    <SplitItem isFilled>
                      <Title headingLevel="h2">{t('Complete ROSA prerequisites')}</Title>
                    </SplitItem>
                    <SplitItem>
                      <ExternalLinkButton isInline variant="link" href={DOC_LINKS.AWS_ROSA_GET_STARTED} target="_blank">
                        {t(' More information on ROSA setup')}
                      </ExternalLinkButton>
                    </SplitItem>
                  </Split>

                  <Stack hasGutter>
                    <StackItem>
                      <Flex>
                        <FlexItem>{t('Step 1:')}</FlexItem>
                        <FlexItem>
                          <StepDownloadROSAClI />
                        </FlexItem>
                      </Flex>
                    </StackItem>
                    <StackItem>
                      <Flex>
                        <FlexItem>{t('Step 2:')}</FlexItem>
                        <FlexItem>
                          <StepCreateAWSAccountRoles />
                        </FlexItem>
                      </Flex>
                    </StackItem>
                    <StackItem>
                      <Flex>
                        <FlexItem>{t('Step 3:')}</FlexItem>
                        <FlexItem>
                          <StepCreateNetwork />
                        </FlexItem>
                      </Flex>
                    </StackItem>
                  </Stack>
                </CardBody>
              </Card>
            </AcmExpandableSection>
          </StackItem>

          <StackItem>
            <Card style={{ backgroundColor: 'var(--pf-t--global--color--brand--subtle--default)' }}>
              <CardHeader>
                <CardTitle>
                  <Title headingLevel="h2" size="xl">
                    {t('Deploy the cluster and set up access')}
                  </Title>
                  <Content component={ContentVariants.p} className="pf-v6-u-font-weight-normal">
                    {t('Select a deployment method')}
                  </Content>
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <WithCLICard />
                  </GridItem>
                  <GridItem span={4}>
                    <WithWizardCard setModalIsOpen={setModalIsOpen} />
                  </GridItem>
                  <GridItem span={4}>
                    <WithTerraFormCard />
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </PageSection>

      <RosaHCPModal
        isModalOpen={modalIsOpen}
        close={close}
        selectedSecret={selectedSecret}
        setSelectedSecret={setSelectedSecret}
      />
    </AcmPage>
  )
}
