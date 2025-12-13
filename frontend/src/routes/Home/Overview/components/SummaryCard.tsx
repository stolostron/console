/* Copyright Contributors to the Open Cluster Management project */
import {
  Card,
  CardBody,
  CardTitle,
  Divider,
  EmptyState,
  EmptyStateBody,
  FlexItem,
  Label,
  Skeleton,
  Content,
  ContentVariants,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmButton } from '../../../../ui-components'

function getLink(type: 'link' | 'button', path: string, count: number) {
  if (type === 'link') {
    return <Link to={path}>{count}</Link>
  } else {
    return (
      <AcmButton variant="link" isInline onClick={() => window.open(path, '_blank')}>
        {count}
      </AcmButton>
    )
  }
}

export default function SummaryCard(props: {
  title: string
  titlePopover?: ReactNode
  summaryTotalHeader: {
    num: string // percentage or count
    text: string
  }
  loading?: boolean
  error?: string
  summaryData: {
    label: string
    count: number
    link: {
      type: 'link' | 'button'
      path: string
    }
    icon?: React.JSX.Element
  }[]
  insights?: boolean
}) {
  const { title, titlePopover, insights, summaryData, summaryTotalHeader, loading, error } = props
  const { t } = useTranslation()

  return (
    <Card isFullHeight>
      <CardTitle>
        {
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {title}
              {titlePopover}
            </div>
            {insights && (
              <Label color={'orange'} style={{ fontWeight: 400 }} isCompact>
                {t('Powered by Insights')}
              </Label>
            )}
          </div>
        }
      </CardTitle>
      <CardBody isFilled={false}>
        {!error ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 'normal' }}>
              <span style={{ fontSize: '24px', fontWeight: '500' }}>{summaryTotalHeader.num}</span>
              <span>{summaryTotalHeader.text}</span>
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div style={{ display: 'flex' }}>
              {summaryData.map((summary) => (
                <div key={`sevrating-${title}-${summary.label}`} style={{ width: 'auto', marginRight: '1.5rem' }}>
                  <div style={{ display: 'flex' }}>
                    {summary.icon && <div style={{ marginRight: '.5rem' }}>{summary.icon}</div>}
                    {!loading ? (
                      <div>
                        {summary.count > 0 ? (
                          getLink(summary.link.type, summary.link.path, summary.count)
                        ) : (
                          <Content>{summary.count}</Content>
                        )}
                      </div>
                    ) : (
                      <Skeleton shape={'square'} width="20px" />
                    )}
                  </div>
                  <FlexItem>
                    <Content>
                      <Content component={ContentVariants.h4}>{summary.label}</Content>
                    </Content>
                  </FlexItem>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            titleText={<>{t('An unexpected error occurred while retrieving metrics.')}</>}
            style={{ paddingTop: 0, marginTop: 'auto' }}
          >
            <EmptyStateBody>{error}</EmptyStateBody>
          </EmptyState>
        )}
      </CardBody>
    </Card>
  )
}

export function LoadingCard() {
  return (
    <Card isFullHeight>
      <CardTitle>
        <Skeleton shape={'square'} width="100px" height="25px" />
      </CardTitle>
      <CardBody isFilled={false}>
        <div>
          <div style={{ display: 'flex', marginTop: '1rem' }}>
            {[0, 1, 2, 3].map((summary) => (
              <div
                key={`sevrating-loading-${summary}`}
                id={`sevrating-loading-${summary}`}
                style={{ width: 'auto', marginRight: '1.5rem' }}
              >
                <div style={{ display: 'flex' }}>
                  <Skeleton shape={'square'} width="20px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
