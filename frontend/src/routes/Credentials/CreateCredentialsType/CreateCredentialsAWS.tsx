/* Copyright Contributors to the Open Cluster Management project */
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  ICatalogBreadcrumb,
  ICatalogCard,
  ItemView,
  PageHeader,
} from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../NavigationPath'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { AcmIcon, AcmIconVariant, AcmPage, Provider } from '../../../ui-components'
import { getTypedCreateCredentialsPath } from '../CreateCredentialsCatalog'

export function CreateCredentialsAWS() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()
  const { customResourceDefinitionsState, managedClusterAddonsState } = useSharedAtoms()
  const [crds] = useRecoilState(customResourceDefinitionsState)
  const [managedClusterAddOns] = useRecoilState(managedClusterAddonsState)
  const hypershiftAddon = managedClusterAddOns.find(
    (mca) => mca.metadata.namespace === 'local-cluster' && mca.metadata.name === 'hypershift-addon'
  )

  const isHypershiftEnabled =
    crds.some(({ metadata }) => metadata.name === 'hostedclusters.hypershift.openshift.io') && hypershiftAddon
  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      {
        id: 'aws-standard',
        title: t('Amazon Web Services'),
        icon: <AcmIcon icon={AcmIconVariant.aws} />,
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('Access key ID, Secret access key'),
          },
        ],
        onClick: nextStep(getTypedCreateCredentialsPath(Provider.aws)),
      },
      {
        id: 'aws-bucket',
        title: t('Amazon Web Services'),
        icon: <AcmIcon icon={AcmIconVariant.awss3} />,
        items: [
          {
            type: CatalogCardItemType.Description,
            description: t('S3 Bucket'),
          },
        ],
        onClick: isHypershiftEnabled ? nextStep(getTypedCreateCredentialsPath(Provider.awss3)) : undefined,
        alertTitle: isHypershiftEnabled
          ? undefined
          : t('Hosted control plane operator and hypershift add-on must be enabled in order to continue'),
        alertVariant: 'info',
        alertContent: (
          <a href={DOC_LINKS.HYPERSHIFT_INTRO} target="_blank" rel="noopener noreferrer">
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
      { label: t('Type'), to: NavigationPath.addCredentials },
      { label: t('AWS credential type') },
    ]
    return newBreadcrumbs
  }, [t])

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Amazon Web Services credential type')}
          description={t('Choose your AWS credential type.')}
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
