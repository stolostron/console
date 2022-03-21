/* Copyright Contributors to the Open Cluster Management project */
import { TextContent } from '@patternfly/react-core'
import { AcmButton, AcmEmptyState } from '@stolostron/ui-components'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'
import { viewDocumentation } from '../../../lib/doc-util'

// GovernanceCreatePolicysetEmptyState

export function GovernanceCreatePolicyEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={t("You don't have any policies")}
            message={
                <Trans
                    i18nKey="Click the <bold>Create policy</bold> button to create your resource."
                    components={{ bold: <strong /> }}
                />
            }
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.createPolicy}>
                        {t('Create policy')}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.POLICIES, t)}</TextContent>
                </div>
            }
        />
    )
}

export function GovernanceManagePoliciesEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={t("You don't have any clusters reporting policy status")}
            message={
                <Trans
                    i18nKey="Click the <bold>Manage policies</bold> button to manage your policies."
                    components={{ bold: <strong /> }}
                />
            }
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                        {t('Manage policies')}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.POLICIES, t)}</TextContent>
                </div>
            }
        />
    )
}

export function GovernanceCreatePolicysetEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={"You don't have any policy sets"}
            message={
                <Trans
                    i18nKey="Click the <bold>Create policy set</bold> button to create your resource."
                    components={{ bold: <strong /> }}
                />
            }
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.createPolicySet}>
                        {t('Create policy set')}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.POLICY_SETS, t)}</TextContent>
                </div>
            }
        />
    )
}
