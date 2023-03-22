/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon } from '@patternfly/react-icons'
import {
  CatalogCardItemType,
  CatalogColor,
  getPatternflyColor,
  ICatalogCard,
  PatternFlyColor,
} from '@stolostron/react-data-view'
import { useTranslation } from '../../../../../../lib/acm-i18next'

function GetHostedCard(onNext: () => void): ICatalogCard {
  const [t] = useTranslation()
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
        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
        items: [
          {
            text: t('Reduces costs by efficiently reusing an OpenShift cluster to host multiple control planes.'),
          },
          { text: t('Quickly provisions clusters.') },
        ],
      },
    ],
    onClick: onNext,
    badgeList: [
      {
        badge: t('Technology preview'),
        badgeColor: CatalogColor.orange,
      },
      {
        badge: t('CLI-based'),
        badgeColor: CatalogColor.purple,
      },
    ],
  }
}
export default GetHostedCard
