/* Copyright Contributors to the Open Cluster Management project */
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  FlexItem,
  Label,
  Skeleton,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmButton } from '../../../ui-components'

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
  summaryTotalHeader?: string
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
  const { title, insights, summaryData, summaryTotalHeader, loading, error } = props
  const { t } = useTranslation()

  return (
    <Card isRounded isFullHeight>
      <CardTitle>
        {
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {title}
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
            {summaryTotalHeader ?? <br />}
            <div style={{ display: 'flex', marginTop: '1rem' }}>
              {summaryData.map((summary) => (
                <div key={`sevrating-${title}-${summary.label}`} style={{ width: 'auto', marginRight: '1.5rem' }}>
                  <div style={{ display: 'flex' }}>
                    {summary.icon && <div style={{ marginRight: '.5rem' }}>{summary.icon}</div>}
                    {!loading ? (
                      <div>
                        {summary.count > 0 ? (
                          getLink(summary.link.type, summary.link.path, summary.count)
                        ) : (
                          <TextContent>{summary.count}</TextContent>
                        )}
                      </div>
                    ) : (
                      <Skeleton shape={'square'} width="20px" />
                    )}
                  </div>
                  <FlexItem>
                    <TextContent>
                      <Text component={TextVariants.h4}>{summary.label}</Text>
                    </TextContent>
                  </FlexItem>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState style={{ paddingTop: 0, marginTop: 'auto' }}>
            <EmptyStateIcon
              style={{ fontSize: '36px', marginBottom: '1rem' }}
              icon={ExclamationCircleIcon}
              color={'var(--pf-global--danger-color--100)'}
            />
            <Title size="md" headingLevel="h4">
              {t('An unexpected error occurred while retrieving metrics.')}
            </Title>
            <EmptyStateBody>{error}</EmptyStateBody>
          </EmptyState>
        )}
      </CardBody>
    </Card>
  )
}

export function LoadingCard() {
  return (
    <Card isRounded isFullHeight>
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
