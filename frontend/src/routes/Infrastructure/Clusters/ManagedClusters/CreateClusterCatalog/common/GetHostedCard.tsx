/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { CatalogCardItemType, ICatalogCard } from '@stolostron/react-data-view'
import { TFunction } from 'react-i18next'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { Icon } from '@patternfly/react-core'

function GetHostedCard(onNext: () => void, t: TFunction, isHypershiftEnabled: boolean): ICatalogCard {
  return {
    id: 'hosted',
    title: t('Hosted'),
    items: [
      {
        type: CatalogCardItemType.Description,
        description: t(
          'Run an OpenShift cluster where the control plane is decoupled from the data plane, and is treated like a multi-tenant workload on a hosting service cluster. The data plane is on a separate network domain that allows segmentation between management and workload traffic.'
        ),
      },
      {
        type: CatalogCardItemType.List,
        title: t(''),
        icon: (
          <Icon status="success">
            <CheckIcon />
          </Icon>
        ),
        items: [
          {
            text: t('Reduces costs by efficiently reusing an OpenShift cluster to host multiple control planes.'),
          },
          { text: t('Quickly provisions clusters.') },
        ],
      },
    ],
    onClick: isHypershiftEnabled ? onNext : undefined,
    alertTitle: isHypershiftEnabled
      ? undefined
      : t('Hosted control plane operator must be enabled in order to continue'),
    alertVariant: 'info',
    alertContent: (
      <a href={DOC_LINKS.HOSTED_ENABLE_FEATURE_AWS} target="_blank" rel="noopener noreferrer">
        {t('View documentation')} <ExternalLinkAltIcon />
      </a>
    ),
  }
}
export default GetHostedCard
