/* Copyright Contributors to the Open Cluster Management project */
import { TextContent } from '@patternfly/react-core'
import { AcmButton, AcmEmptyState } from '../../../ui-components'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'
import { viewDocumentation } from '../../../lib/doc-util'

// GovernanceCreatePolicysetEmptyState

export function GovernanceCreatePolicyEmptyState(props: { rbac: boolean }) {
  const { t } = useTranslation()
  return (
    <AcmEmptyState
      title={t("You don't have any policies")}
      message={
        <Trans i18nKey="Click <bold>Create policy</bold> to create your resource." components={{ bold: <strong /> }} />
      }
      action={
        <div>
          <AcmButton
            tooltip={!props.rbac ? t('rbac.unauthorized') : ''}
            isDisabled={!props.rbac}
            component={Link}
            variant="primary"
            to={NavigationPath.createPolicy}
          >
            {t('Create policy')}
          </AcmButton>
          <TextContent>{viewDocumentation(DOC_LINKS.POLICIES, t)}</TextContent>
        </div>
      }
    />
  )
}

export function GovernanceManagePoliciesEmptyState(props: { rbac: boolean }) {
  const { t } = useTranslation()
  return (
    <AcmEmptyState
      title={t("You don't have any clusters reporting policy status")}
      message={
        <Trans
          i18nKey="Click <bold>Manage policies</bold> to manage your policies."
          components={{ bold: <strong /> }}
        />
      }
      action={
        <div>
          <AcmButton
            tooltip={!props.rbac ? t('rbac.unauthorized') : ''}
            isDisabled={!props.rbac}
            component={Link}
            variant="primary"
            to={NavigationPath.policies}
          >
            {t('Manage policies')}
          </AcmButton>
          <TextContent>{viewDocumentation(DOC_LINKS.POLICIES, t)}</TextContent>
        </div>
      }
    />
  )
}

export function GovernanceCreatePolicysetEmptyState(props: { rbac: boolean }) {
  const { t } = useTranslation()
  return (
    <AcmEmptyState
      title={t("You don't have any policy sets")}
      message={
        <Trans
          i18nKey="Click <bold>Create policy set</bold> to create your resource."
          components={{ bold: <strong /> }}
        />
      }
      action={
        <div>
          <AcmButton
            tooltip={!props.rbac ? t('rbac.unauthorized') : ''}
            isDisabled={!props.rbac}
            component={Link}
            variant="primary"
            to={NavigationPath.createPolicySet}
          >
            {t('Create policy set')}
          </AcmButton>
          <TextContent>{viewDocumentation(DOC_LINKS.POLICY_SETS, t)}</TextContent>
        </div>
      }
    />
  )
}
