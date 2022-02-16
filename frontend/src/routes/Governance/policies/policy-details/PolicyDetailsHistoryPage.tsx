/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader } from '@stolostron/ui-components'
import { Fragment, Suspense } from 'react'
import { Route, Switch, useLocation } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import PolicyDetailsHistory from './PolicyDetailsHistory'

export default function PolicyDetailsHistoryPage() {
    const location = useLocation()
    const { t } = useTranslation()

    // Comb the array to make formatting easier for policy name & namespace identification
    const combedUrl = location.pathname.replace('/multicloud/governance/policies/', '')
    const urlArray = combedUrl.split('/')

    // Grab policy data from fixed array positions
    const policyNamespace = urlArray[0]
    const policyName = urlArray[1]
    const clusterName = urlArray[3]
    const templateName = urlArray[5]

    const historyUrl = NavigationPath.policyDetailsHistory
        .replace(':namespace', policyNamespace as string)
        .replace(':name', policyName as string)
        .replace(':clusterName', clusterName as string)
        .replace(':templateName', templateName as string)

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('History')}
                    breadcrumb={[
                        { text: t('Policies'), to: NavigationPath.policies },
                        {
                            text: policyName,
                            to: NavigationPath.policyDetailsResults
                                .replace(':namespace', policyNamespace as string)
                                .replace(':name', policyName as string),
                        },
                        { text: t('History'), to: '' },
                    ]}
                    popoverAutoWidth={false}
                    popoverPosition="bottom"
                />
            }
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route
                        exact
                        path={historyUrl}
                        render={() => (
                            <PolicyDetailsHistory
                                policyName={policyName}
                                policyNamespace={policyNamespace}
                                clusterName={clusterName}
                                templateName={templateName}
                            />
                        )}
                    />
                </Switch>
            </Suspense>
        </AcmPage>
    )
}
