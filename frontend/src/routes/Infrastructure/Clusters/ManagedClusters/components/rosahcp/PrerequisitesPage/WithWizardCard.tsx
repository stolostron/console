/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  ContentVariants,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { DesktopIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../../../../../lib/acm-i18next'

type WithWizardCardProps = {
  setModalIsOpen: (bool: boolean) => void
}

export const WithWizardCard = (props: WithWizardCardProps) => {
  const [t] = useTranslation()
  const { setModalIsOpen } = props

  return (
    <Card isFullHeight>
      <CardTitle>
        <Title headingLevel="h3" size="lg">
          <Stack>
            <StackItem>
              <DesktopIcon className="acm-c-wizard-get-started--card-icon" />
            </StackItem>
            <StackItem>{t('Deploy with web interface')}</StackItem>
          </Stack>
        </Title>
      </CardTitle>

      <CardBody>
        <Content component={ContentVariants.p} className="pf-v6-u-mb-sm">
          {t('You can deploy your cluster with the web interface.')}
        </Content>
        <Alert
          variant="info"
          isInline
          isPlain
          title={t('Your AWS account will need to be associated with your Red Hat account.')}
        />
      </CardBody>

      <CardFooter>
        <Button variant="primary" onClick={() => setModalIsOpen(true)}>
          {t('Deploy with web interface')}
        </Button>
      </CardFooter>
    </Card>
  )
}
