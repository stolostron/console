/* Copyright Contributors to the Open Cluster Management project */
import {
  Card,
  CardBody,
  CardTitle,
  FlexItem,
  Label,
  Skeleton,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core'
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
  const { title, insights, summaryData, summaryTotalHeader, loading } = props
  const { t } = useTranslation()

  return (
    <Card isRounded>
      <CardTitle>
        {
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {title}
            {insights ? (
              <Label color={'orange'} style={{ fontWeight: 400 }} isCompact>
                {t('Powered by Insights')}
              </Label>
            ) : (
              <Label color={'grey'} style={{ fontWeight: 400 }} isCompact>
                {t('Insights data coming soon')}
              </Label>
            )}
          </div>
        }
      </CardTitle>
      <CardBody isFilled={false}>
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
      </CardBody>
    </Card>
  )
}
