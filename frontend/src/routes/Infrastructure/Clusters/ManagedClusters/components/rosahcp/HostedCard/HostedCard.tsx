/* Copyright Contributors to the Open Cluster Management project */

import {
  Flex,
  FlexItem,
  Card,
  CardTitle,
  Content,
  ContentVariants,
  CardBody,
  Stack,
  StackItem,
  List,
  ListItem,
  Button,
  CardFooter,
  Tooltip,
} from '@patternfly/react-core'
import { Link } from 'react-router'
import { DevPreviewLabel } from '~/components/TechPreviewAlert'
import { useTranslation } from '~/lib/acm-i18next'
import { NavigationPath } from '~/NavigationPath'

type HostedCardProps = {
  setIsModalOpen: (bool: boolean) => void
  withCliClick?: () => void
  areCapiCapaEnabled: boolean
  isHypershiftEnabled: boolean
}

const CreateButtonLink = (props: any) => <Link {...props} to={NavigationPath.prerequisites} />

export const HostedCard = (props: HostedCardProps) => {
  const [t] = useTranslation()
  const { setIsModalOpen, withCliClick, isHypershiftEnabled, areCapiCapaEnabled } = props

  return (
    <Flex direction={{ default: 'row' }} alignItems={{ default: 'alignItemsStretch' }}>
      <FlexItem flex={{ default: 'flex_1' }}>
        <Card isFullHeight>
          <CardTitle>
            <DevPreviewLabel />
            <Content component={ContentVariants.h4}>{t('ROSA')}</Content>
            <Content component={ContentVariants.p}>{t('Managed by Red Hat')}</Content>
          </CardTitle>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <List>
                  <ListItem>{t('Red Hat SRE managed')}</ListItem>
                  <ListItem>{t('Zero-cost control plane infra')}</ListItem>
                  <ListItem>{t('Full compliance certifications')}</ListItem>
                </List>
              </StackItem>
              <StackItem>
                <Stack hasGutter>
                  <StackItem>
                    <Tooltip
                      content={t('Enable Cluster API and Cluster API for AWS in order to continue')}
                      trigger={areCapiCapaEnabled ? 'manual' : 'mouseenter focus'}
                    >
                      <span tabIndex={areCapiCapaEnabled ? undefined : 0}>
                        <Button isDisabled={!areCapiCapaEnabled} variant="primary" onClick={() => setIsModalOpen(true)}>
                          {t('Deploy with web interface')}
                        </Button>
                      </span>
                    </Tooltip>
                  </StackItem>
                  <StackItem>
                    <Button
                      isDisabled={!areCapiCapaEnabled}
                      variant="link"
                      className="create-button"
                      component={CreateButtonLink}
                    >
                      {t('View ROSA prerequisites')}
                    </Button>
                  </StackItem>
                </Stack>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </FlexItem>

      <FlexItem flex={{ default: 'flex_1' }}>
        <Card isFullHeight>
          <CardTitle>
            <Content component={ContentVariants.h4}>{t('AWS (self managed)')}</Content>
            <Content component={ContentVariants.p}>{t('Managed by you')}</Content>
          </CardTitle>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <List>
                  <ListItem>
                    {t('Efficiently reuse existing OpenShift clusters to host multiple control planes')}
                  </ListItem>
                  <ListItem>{t('Fully self-managed control')}</ListItem>
                </List>
              </StackItem>
            </Stack>
          </CardBody>
          <CardFooter>
            <Tooltip
              content={t('Hosted control plane operator must be enabled in order to continue')}
              trigger={isHypershiftEnabled ? 'manual' : 'mouseenter focus'}
            >
              <span tabIndex={isHypershiftEnabled ? undefined : 0}>
                <Button variant="primary" isDisabled={!isHypershiftEnabled} onClick={() => withCliClick?.()}>
                  {t('Deploy with CLI')}
                </Button>
              </span>
            </Tooltip>
          </CardFooter>
        </Card>
      </FlexItem>
    </Flex>
  )
}
