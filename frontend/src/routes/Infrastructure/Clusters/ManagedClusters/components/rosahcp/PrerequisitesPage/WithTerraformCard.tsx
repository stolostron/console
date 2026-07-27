/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle, Content, ContentVariants, Stack, StackItem, Title } from '@patternfly/react-core'
import TerraformLogo from './TerraformLogo'
import { Trans, useTranslation } from '../../../../../../../lib/acm-i18next'
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
          <Trans
            i18nKey="Learn how to <deployLink>deploy a ROSA HCP cluster</deployLink> or <registryLink>visit the Terraform registry</registryLink>"
            components={{
              deployLink: (
                <a target="_blank" href={DOC_LINKS.TERRAFORM_ROSA_HCP_URL}>
                  {}
                </a>
              ),
              registryLink: (
                <a target="_blank" href={DOC_LINKS.TERRAFORM_REGISTRY_ROSA_HCP}>
                  {}
                </a>
              ),
            }}
          />
        </Content>
      </CardBody>
    </Card>
  )
}
