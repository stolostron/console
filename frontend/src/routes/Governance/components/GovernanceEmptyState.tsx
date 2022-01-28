/* Copyright Contributors to the Open Cluster Management project */
import { TextContent, Text, TextVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmButton, AcmEmptyState } from '@stolostron/ui-components'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { DOC_LINKS } from '../../../lib/doc-util'

// GovernanceCreatePolicysetEmptyState

export function GovernanceCreatePolicyEmptyState() {
    const { t } = useTranslation()
    return (
        <AcmEmptyState
            title={'Create policies to start monitoring cluster health'}
            message={t('Use the button below to create a policy.')}
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                        {t('Create a policy')}
                    </AcmButton>
                    <TextContent>
                        <Text
                            component={TextVariants.a}
                            isVisitedLink
                            href={DOC_LINKS.POLICIES}
                            target="_blank"
                            style={{
                                cursor: 'pointer',
                                display: 'inline-block',
                                padding: '0px 10px',
                                fontSize: '14px',
                                color: '#0066cc',
                            }}
                        >
                            {t('View documentation')} <ExternalLinkAltIcon />
                        </Text>
                    </TextContent>
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
            message={t('Use the button below to manage policies.')}
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                        {t('Create a policy')}
                    </AcmButton>
                    <TextContent>
                        <Text
                            component={TextVariants.a}
                            isVisitedLink
                            href={DOC_LINKS.POLICIES}
                            target="_blank"
                            style={{
                                cursor: 'pointer',
                                display: 'inline-block',
                                padding: '0px 10px',
                                fontSize: '14px',
                                color: '#0066cc',
                            }}
                        >
                            {t('View documentation')} <ExternalLinkAltIcon />
                        </Text>
                    </TextContent>
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
            message={t('Use the button below to create a policy set.')}
            action={
                <div>
                    <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                        {t('Create policy set')}
                    </AcmButton>
                    <TextContent>
                        <Text
                            component={TextVariants.a}
                            isVisitedLink
                            href={DOC_LINKS.POLICY_SETS}
                            target="_blank"
                            style={{
                                cursor: 'pointer',
                                display: 'inline-block',
                                padding: '0px 10px',
                                fontSize: '14px',
                                color: '#0066cc',
                            }}
                        >
                            {t('View documentation')} <ExternalLinkAltIcon />
                        </Text>
                    </TextContent>
                </div>
            }
        />
    )
}
