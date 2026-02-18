/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Content, ContentVariants, PageSection, Stack, StackItem } from '@patternfly/react-core'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { ClustersTable } from '../../../../components/Clusters/ClustersTable'
import { KubevirtProviderAlert } from '../../../../components/KubevirtProviderAlert'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { useTranslation } from '../../../../lib/acm-i18next'
import { canUser } from '../../../../lib/rbac-util'
import { navigateToBackCancelLocation, NavigationPath } from '../../../../NavigationPath'
import { ManagedClusterDefinition } from '../../../../resources'
import { addonPathKey, addonTextKey } from '../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AcmAlertContext,
  AcmEmptyState,
  AcmLaunchLink,
  AcmPageContent,
  AcmTableStateProvider,
} from '../../../../ui-components'
import { usePageContext } from '../ClustersPage'
import { AddCluster } from './components/AddCluster'
import { OnboardingModal } from './components/OnboardingModal'
import { useAllClusters } from './components/useAllClusters'

const onToggle = (acmCardID: string, setOpen: (open: boolean) => void) => {
  setOpen(false)
  localStorage.setItem(acmCardID, 'hide')
}

export default function ManagedClusters() {
  const { t } = useTranslation()
  const alertContext = useContext(AcmAlertContext)
  const clusters = useAllClusters(true)
  const localHubName = useLocalHubName()

  const onBoardingModalID = 'clusteronboardingmodal'
  const [openOnboardingModal, setOpenOnboardingModal] = useState<boolean>(
    localStorage.getItem(onBoardingModalID)
      ? localStorage.getItem(onBoardingModalID) === 'show'
      : clusters.length === 1 && clusters.find((lc) => lc.name === localHubName) !== undefined //Check if one cluster exists and it is local-cluster
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])

  const OnBoardingModalLink = useCallback(() => {
    return (
      <Content
        component={ContentVariants.a}
        isVisitedLink
        style={{
          cursor: 'pointer',
          display: 'inline-block',
        }}
        onClick={() => setOpenOnboardingModal(true)}
      >
        {t('Get started with Multicluster Hub')}
      </Content>
    )
  }, [t])

  usePageContext(clusters.length > 0, PageActions, OnBoardingModalLink)

  const navigate = useNavigate()
  const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
  useEffect(() => {
    const canCreateManagedCluster = canUser('create', ManagedClusterDefinition)
    canCreateManagedCluster.promise
      .then((result) => setCanCreateCluster(result.status?.allowed!))
      .catch((err) => console.error(err))
    return () => canCreateManagedCluster.abort()
  }, [])

  return (
    <AcmPageContent id="clusters">
      <PageSection hasBodyWrapper={false}>
        <OnboardingModal open={openOnboardingModal} close={() => onToggle(onBoardingModalID, setOpenOnboardingModal)} />
        <Stack hasGutter={true}>
          <StackItem>
            <div style={{ marginBottom: '1em' }}>
              <KubevirtProviderAlert variant="search" component="hint" hideAlertWhenNoVMsExists />
            </div>
            <AcmTableStateProvider localStorageKey={'managed-clusters-table-state'}>
              <ClustersTable
                clusters={clusters}
                tableKey="managedClusters"
                tableButtonActions={[
                  {
                    id: 'createCluster',
                    title: t('managed.createCluster'),
                    click: () => navigateToBackCancelLocation(navigate, NavigationPath.createCluster),
                    isDisabled: !canCreateCluster,
                    tooltip: t('rbac.unauthorized'),
                    variant: ButtonVariant.primary,
                  },
                  {
                    id: 'importCluster',
                    title: t('managed.importCluster'),
                    click: () => navigateToBackCancelLocation(navigate, NavigationPath.importCluster),
                    isDisabled: !canCreateCluster,
                    tooltip: t('rbac.unauthorized'),
                    variant: ButtonVariant.secondary,
                  },
                ]}
                emptyState={
                  <AcmEmptyState
                    key="mcEmptyState"
                    title={t("You don't have any clusters yet")}
                    message={t('To get started, create a cluster or import an existing cluster.')}
                    action={<AddCluster type="button" />}
                  />
                }
              />
            </AcmTableStateProvider>
          </StackItem>
        </Stack>
      </PageSection>
    </AcmPageContent>
  )
}

const PageActions = () => {
  const { clusterManagementAddonsState } = useSharedAtoms()
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const addons = clusterManagementAddons.filter(
    (cma) => cma.metadata.annotations?.[addonTextKey] && cma.metadata.annotations?.[addonPathKey]
  )

  return (
    <AcmLaunchLink
      links={addons?.map((cma) => ({
        id: cma.metadata.annotations?.[addonTextKey]!,
        text: cma.metadata.annotations?.[addonTextKey]!,
        href: cma.metadata.annotations?.[addonPathKey]!,
      }))}
    />
  )
}
