/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'
import { Fragment, Suspense, useMemo } from 'react'
import { Link, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { policiesState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy } from '../../../../resources'
import { getPolicyDetailSourceLabel } from '../util'
import PolicyDetailsOverview from './PolicyDetailsOverview'
import PolicyDetailsResults from './PolicyDetailsResults'

export default function PolicyDetailsPage() {
    const location = useLocation()
    // const history = useHistory()
    const { t } = useTranslation()
    const [policies] = useRecoilState(policiesState)

    // Comb the array to make formatting easier for policy name & namespace identification
    const combedUrl = location.pathname.replace('/multicloud/governance/policies/', '')
    const urlArray = combedUrl.split('/')

    // Grab policy data from fixed array positions
    const policyNamespace = urlArray[0]
    const policyName = urlArray[1]

    // Using fixed length url array after combing find which tab is active
    const isResultsTab = urlArray.length === 3 && location.pathname.endsWith('/results')

    const detailsUrl = NavigationPath.policyDetails
        .replace(':namespace', policyNamespace as string)
        .replace(':name', policyName as string)
    const resultsUrl = NavigationPath.policyDetailsResults
        .replace(':namespace', policyNamespace as string)
        .replace(':name', policyName as string)

    const selectedPolicy: Policy = useMemo(() => {
        const idx =
            policies.findIndex(
                (policy: Policy) => policy.metadata.namespace === policyNamespace && policy.metadata.name === policyName
            ) ?? 0
        return policies[idx]
    }, [policies])

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={policyName ?? 'Policy details'}
                    breadcrumb={[
                        { text: t('Policies'), to: NavigationPath.policies },
                        { text: policyName ?? 'Policy details', to: '' },
                    ]}
                    popoverAutoWidth={false}
                    popoverPosition="bottom"
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={!isResultsTab}>
                                <Link to={detailsUrl}>{t('Details')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem isActive={isResultsTab}>
                                <Link to={resultsUrl}>{t('Results')}</Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    description={getPolicyDetailSourceLabel(selectedPolicy)}
                    // TODO once edit policy wizard is done
                    // controls={
                    //     <Fragment>
                    //         <AcmButton
                    //             key="edit-policy"
                    //             id="edit-policy"
                    //             onClick={() => history.push(NavigationPath.editPolicy)}
                    //         >
                    //             {t('Edit policy')}
                    //         </AcmButton>
                    //     </Fragment>
                    // }
                />
            }
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route exact path={detailsUrl} render={() => <PolicyDetailsOverview policy={selectedPolicy} />} />
                    <Route exact path={resultsUrl} render={() => <PolicyDetailsResults policy={selectedPolicy} />} />
                    {/* History page? */}
                    {/* <Route exact path={templatesUrl} render={() => <PolicyDetails />} /> */}
                </Switch>
            </Suspense>
        </AcmPage>
    )
}
