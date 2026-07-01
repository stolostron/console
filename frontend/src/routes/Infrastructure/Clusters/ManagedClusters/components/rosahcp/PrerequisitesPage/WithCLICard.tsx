import {
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
import { CodeIcon } from '@patternfly/react-icons/dist/esm/icons/code-icon'
import { useTranslation } from '../../../../../../../lib/acm-i18next'
import InstructionCommand from './InstructionCommand'
import { DOC_LINKS } from '../../../../../../../lib/doc-util'

export const WithCLICard = () => {
  const [t] = useTranslation()

  return (
    <Card isFullHeight>
      <CardTitle>
        <Title headingLevel="h3" size="lg">
          <Stack>
            <StackItem>
              <CodeIcon className="acm-c-wizard-get-started--card-icon" />
            </StackItem>
            <StackItem>{t('Deploy with CLI')}</StackItem>
          </Stack>
        </Title>
      </CardTitle>

      <CardBody>
        <Content component={ContentVariants.p}>
          {t('Run the create command in your terminal to begin setup in interactive mode.')}
        </Content>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <InstructionCommand textAriaLabel={t('Copyable ROSA create cluster command')}>
          rosa create cluster
        </InstructionCommand>
      </CardBody>

      <CardFooter>
        {t('Learn how to')}{' '}
        <a target="_blank" rel="noreferrer" href={DOC_LINKS.ROSA_HCP_CLI_URL}>
          {t('deploy ROSA clusters with the ROSA CLI')}
        </a>
      </CardFooter>
    </Card>
  )
}
