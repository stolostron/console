/* Copyright Contributors to the Open Cluster Management project */
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  ICatalogBreadcrumb,
  ICatalogCard,
  ItemView,
  PageHeader,
} from '@stolostron/react-data-view'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../NavigationPath'
import { listMultiClusterEngines } from '../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { AcmIcon, AcmIconVariant, AcmPage, Provider } from '../../../ui-components'
import { getTypedCreateCredentialsPath } from '../CreateCredentialsCatalog'

export function CreateCredentialsAWS() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const { managedClusterAddonsState } = useSharedAtoms()
  const [managedClusterAddOns] = useRecoilState(managedClusterAddonsState)
  const hypershiftAddon = managedClusterAddOns.find(
    (mca) => mca.metadata.namespace === 'local-cluster' && mca.metadata.name === 'hypershift-addon'
  )

  const [isHypershiftEnabled, setIsHypershiftEnabled] = useState<boolean>(false)
  useEffect(() => {
    const getHypershiftStatus = async () => {
      try {
        const [multiClusterEngine] = await listMultiClusterEngines().promise
        const components = multiClusterEngine.spec?.overrides.components
        const hypershiftLocalHosting = components?.find((component) => component.name === 'hypershift-local-hosting')
        const hypershiftPreview = components?.find((component) => component.name === 'hypershift-preview')
        setIsHypershiftEnabled(
          (hypershiftLocalHosting?.enabled &&
            hypershiftPreview?.enabled &&
            hypershiftAddon?.status?.conditions?.find((c) => c.reason === 'ManagedClusterAddOnLeaseUpdated')?.status ===
              'True') as boolean
        )
      } catch {
        // nothing to do
      }
    }
    getHypershiftStatus()
  }, [hypershiftAddon?.status?.conditions])

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      {
        id: 'aws-standard',
        title: t('Amazon Web Services'),
        icon: <AcmIcon icon={AcmIconVariant.aws} />,
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('Red Hat OpenShift Provisioning'),
          },
        ],
        onClick: nextStep(getTypedCreateCredentialsPath(Provider.aws)),
      },
      {
        id: 'aws-bucket',
        title: t('S3 Bucket'),
        icon: <AcmIcon icon={AcmIconVariant.awss3} />,
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('OIDC Secret for Red Hat OpenShift Provisioning with hosted control plane'),
          },
        ],
        onClick: isHypershiftEnabled ? nextStep(getTypedCreateCredentialsPath(Provider.awss3)) : undefined,
        alertTitle: isHypershiftEnabled
          ? undefined
          : t('Hosted control plane operator and hypershift add-on must be enabled in order to continue'),
        alertVariant: 'info',
        alertContent: (
          <a href={DOC_LINKS.HOSTED_ENABLE_FEATURE_AWS} target="_blank" rel="noopener noreferrer">
            {t('View documentation')} <ExternalLinkAltIcon />
          </a>
        ),
      },
    ]
    return newCards
  }, [nextStep, t, isHypershiftEnabled])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs: ICatalogBreadcrumb[] = [
      { label: t('Credentials'), to: NavigationPath.credentials },
      { label: t('Credential type'), to: NavigationPath.addCredentials },
      { label: t('Amazon Web Services credential') },
    ]
    return newBreadcrumbs
  }, [t])

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Amazon Web Services credential')}
          description={t('Choose your AWS credential.')}
          breadcrumbs={breadcrumbs}
        />
      }
    >
      <ItemView
        items={cards}
        itemKeyFn={keyFn}
        itemToCardFn={(card) => card}
        onBack={back(NavigationPath.createCluster)}
        onCancel={cancel(NavigationPath.clusters)}
      />
    </AcmPage>
  )
}
