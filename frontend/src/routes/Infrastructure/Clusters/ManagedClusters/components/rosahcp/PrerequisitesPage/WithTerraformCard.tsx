/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle, Content, ContentVariants, Stack, StackItem, Title } from '@patternfly/react-core'
import TerraformLogo from './TerraformLogo'
import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../../lib/doc-util'

export const WithTerraFormCard = () => {
  const [t] = useTranslation()

  return (
    <Card isFullHeight>
      <CardTitle>
        <Title headingLevel="h3" size="lg">
          <Stack>
            <StackItem>
              <TerraformLogo className="acm-c-wizard-get-started-terraform--card-icon" />
            </StackItem>
            <StackItem>{t('Deploy with Teraform')}</StackItem>
          </Stack>
        </Title>
      </CardTitle>

      <CardBody>
        <Content component={ContentVariants.p} className="pf-v6-u-mb-sm">
          {t('Create a ROSA HCP cluster using Terraform')}
        </Content>
        <Content component={ContentVariants.p} className="pf-v6-u-mb-sm">
          {t('Learn how to')}{' '}
          <a target="_blank" href={DOC_LINKS.TERRAFORM_ROSA_HCP_URL}>
            {t('deploy a ROSA HCP cluster')}
          </a>{' '}
          {t('or')}{' '}
          <a target="_blank" href={DOC_LINKS.TERRAFORM_REGISTRY_ROSA_HCP}>
            {t('visit the Terraform registry')}
          </a>
        </Content>
      </CardBody>
    </Card>
  )
}
