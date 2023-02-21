/* Copyright Contributors to the Open Cluster Management project */
import { LocationDescriptor } from 'history'
import { ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { useCallback, useMemo } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { BackCancelState, NavigationPath, useBackCancelNavigation } from '../../NavigationPath'
import { AcmIcon, AcmPage, Provider, ProviderIconMap, ProviderLongTextMap } from '../../ui-components'
import { CredentialsType, CREDENTIALS_TYPE_PARAM } from './CredentialsType'

export const getTypedCreateCredentialsPath = (type: CredentialsType): LocationDescriptor<BackCancelState> => ({
  pathname: NavigationPath.addCredentials,
  search: `?${CREDENTIALS_TYPE_PARAM}=${type}`,
})

const orderedProviders: [provider: CredentialsType, id?: string][] = [
  [Provider.aws],
  [Provider.awss3, 's3'],
  [Provider.azure, 'azure'],
  [Provider.gcp, 'google'],
  [Provider.openstack, 'openstack'],
  [Provider.redhatvirtualization, 'rhv'],
  [Provider.vmware, 'vsphere'],
  [Provider.hostinventory],
  [Provider.ansible, 'ansible'],
  [Provider.redhatcloud, 'redhatcloud'],
]

export function CreateCredentialsCatalog() {
  const [t] = useTranslation()
  const { nextStep, back, cancel } = useBackCancelNavigation()

  const cards = useMemo(() => {
    const newCards: ICatalogCard[] = [
      ...orderedProviders
        // does not display AWS s3 card
        .filter(([id]) => id !== Provider.awss3)
        .map(([provider, id]) => ({
          id: id || provider,
          icon: <AcmIcon icon={ProviderIconMap[provider]} />,
          title: ProviderLongTextMap[provider],
          onClick:
            provider === Provider.aws
              ? nextStep(NavigationPath.addAWSType)
              : nextStep(getTypedCreateCredentialsPath(provider)),
        })),
    ]
    return newCards
  }, [nextStep])

  const keyFn = useCallback((card: ICatalogCard) => card.id, [])

  const breadcrumbs = useMemo(
    () => [{ label: t('Credentials'), to: NavigationPath.credentials }, { label: t('Credential type') }],
    [t]
  )

  return (
    <AcmPage
      header={
        <PageHeader
          title={t('Credential Type')}
          description={t('Choose your credential type.')}
          breadcrumbs={breadcrumbs}
          titleHelp={
            <a href={DOC_LINKS.CREATE_CONNECTION} target="_blank" rel="noreferrer">
              {t('What are the different credentials types?')}
            </a>
          }
        />
      }
    >
      <ItemView
        items={cards}
        itemKeyFn={keyFn}
        itemToCardFn={(card) => card}
        onBack={back(NavigationPath.credentials)}
        onCancel={cancel(NavigationPath.credentials)}
      />
    </AcmPage>
  )
}
