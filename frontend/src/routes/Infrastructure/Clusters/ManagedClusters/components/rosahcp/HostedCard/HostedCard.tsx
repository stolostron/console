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
} from '@patternfly/react-core'
import { Link } from 'react-router'
import { DevPreviewLabel } from '~/components/TechPreviewAlert'
import { useTranslation } from '~/lib/acm-i18next'
import { NavigationPath } from '~/NavigationPath'

type HostedCardProps = {
  setIsModalOpen: (bool: boolean) => void
  withCliClick?: () => void
}

const CreateButtonLink = (props: any) => <Link {...props} to={NavigationPath.prerequisites} />

export const HostedCard = (props: HostedCardProps) => {
  const [t] = useTranslation()
  const { setIsModalOpen, withCliClick } = props

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
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                      {t('Deploy with web interface')}
                    </Button>
                  </StackItem>
                  <StackItem>
                    <Button variant="link" className="create-button" component={CreateButtonLink}>
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
            <Button variant="primary" onClick={() => withCliClick?.()}>
              {t('Deploy with CLI')}
            </Button>
          </CardFooter>
        </Card>
      </FlexItem>
    </Flex>
  )
}
