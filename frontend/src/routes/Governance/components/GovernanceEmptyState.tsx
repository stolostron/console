/* Copyright Contributors to the Open Cluster Management project */
import { Text, TextContent, TextVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmButton, AcmEmptyState } from '@stolostron/ui-components'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'

// GovernanceCreatePolicysetEmptyState

function viewDocumentation(doclink: string) {
    const { t } = useTranslation()
    return (
        <Text
            component={TextVariants.a}
            isVisitedLink
            href={doclink}
            target="_blank"
            style={{
                cursor: 'pointer',
                display: 'inline-block',
                padding: '15px 10px',
                fontSize: '14px',
            }}
        >
            {t('View documentation')} <ExternalLinkAltIcon />
        </Text>
    )
}

export function GovernanceCreatePolicyEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={'Create policies to start monitoring cluster health'}
            message={t('Use the following button to create a policy.')}
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                        {t('Create policy')}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.POLICIES)}</TextContent>
                </div>
            }
        />
    )
}

export function GovernanceManagePoliciesEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={'Manage policies to start monitoring cluster health'}
            message={t('Use the following button to manage policies.')}
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                        {t('Create policy')}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.POLICIES)}</TextContent>
                </div>
            }
        />
    )
}

export function GovernanceCreatePolicysetEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={'Apply a policy set to multiple clusters'}
            message={t('Use the following button to create a policy set.')}
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.createPolicySet}>
                        {'Create policy set'}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.POLICY_SETS)}</TextContent>
                </div>
            }
        />
    )
}
