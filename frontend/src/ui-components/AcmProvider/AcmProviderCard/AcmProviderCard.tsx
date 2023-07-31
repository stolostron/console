/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeaderMain,
  Gallery,
  GalleryItem,
  Stack,
  StackItem,
  Text,
  TextVariants,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { Provider, ProviderIconMap, ProviderShortTextMap } from '../'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { AddCluster } from '../../../routes/Infrastructure/Clusters/ManagedClusters/components/AddCluster'
import { AcmEmptyState } from '../../AcmEmptyState'
import { AcmIcon } from '../../AcmIcons/AcmIcons'

const icon = css({
  '& svg, & img': {
    width: '56px',
    height: '56px',
  },
})
const providerTitle = css({
  marginTop: '4px',
  fontSize: 'var(--pf-c-title--m-3xl--FontSize)',
  lineHeight: 'var(--pf-c-title--m-3xl--LineHeight)',
})
const dangerIcon = css({
  width: '16px',
  height: '16px',
  marginLeft: '8px',
  verticalAlign: 'unset !important',
})
const clusterCount = css({
  fontSize: '28px',
})
const clusterText = css({
  fontSize: '14px',
  fontWeight: 600,
})

type ProviderCardProps = {
  provider: Provider
  clusterCount: number | undefined
  onClick: (provider: string) => void
  danger?: boolean
  isSelected?: boolean
}

export function AcmOverviewProviders(props: { providers: ProviderCardProps[] }) {
  const { t } = useTranslation()
  if (props.providers.length === 0) {
    return (
      <AcmEmptyState
        title={t('managed.emptyStateHeader')}
        message={<Trans i18nKey="managed.emptyStateMsg" components={{ bold: <strong /> }} />}
        action={<AddCluster type="button" />}
      />
    )
  }
  return (
    <Gallery hasGutter>
      {props.providers.map((provider) => (
        <GalleryItem key={provider.provider}>
          <AcmProviderCard {...provider} />
        </GalleryItem>
      ))}
    </Gallery>
  )
}

export function AcmProviderCard(props: ProviderCardProps) {
  const { t } = useTranslation()
  return (
    <Card
      onClick={() => props.onClick(props.provider)}
      onKeyDown={(event: React.KeyboardEvent) => [13, 32].includes(event.keyCode) && props.onClick(props.provider)}
      isSelectable
      isSelected={props.isSelected}
      id={`${props.provider}-provider-card`}
    >
      <Stack>
        <StackItem>
          <CardHeader>
            <CardHeaderMain>
              <div className={icon}>
                <AcmIcon icon={ProviderIconMap[props.provider]} />
              </div>
              <Title headingLevel="h2" size="3xl" className={providerTitle} style={{ fontWeight: 300 }}>
                {ProviderShortTextMap[props.provider]}
                {props.danger && (
                  <ExclamationCircleIcon
                    color="var(--pf-global--palette--red-100)"
                    className={`${dangerIcon} danger-icon`}
                  />
                )}
              </Title>
            </CardHeaderMain>
          </CardHeader>
        </StackItem>
        <StackItem isFilled></StackItem>
        <StackItem>
          <CardFooter>
            <Text component={TextVariants.p} className={clusterCount}>
              {props.clusterCount}
            </Text>
            <Text component={TextVariants.p} className={clusterText}>
              {props.clusterCount === 1 ? t('Cluster') : t('Clusters')}
            </Text>
          </CardFooter>
        </StackItem>
      </Stack>
    </Card>
  )
}
