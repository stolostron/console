/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle, Skeleton } from '@patternfly/react-core'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom-v5-compat'

export interface Data {
  mainSection: {
    title: string
    description: string
    link?: string
  }
  statusSection: {
    title: string
    count: number
    icon?: ReactNode
    link?: string
  }[]
  loading?: boolean
}

export function SummaryStatusCard(props: { key: string; title: string; data: Data }) {
  const { key, title, data } = props
  return (
    <Card isRounded key={key} style={{ height: '200px' }}>
      <CardTitle>{title}</CardTitle>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <div
            key={`${key}-container`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1,
                paddingBottom: '1rem',
                marginRight: '3rem',
              }}
            >
              {data?.loading ? (
                <Skeleton style={{ marginBottom: '10px', height: '30px' }} />
              ) : data.mainSection.link ? (
                <Link style={{ fontSize: 24 }} to={data.mainSection.link}>
                  {data.mainSection.title}
                </Link>
              ) : (
                <span style={{ fontSize: 24 }}>{data.mainSection.title}</span>
              )}
              <span>{data.mainSection.description}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!data?.loading ? (
                data.statusSection.map((status, index) => {
                  return (
                    <div key={`${key}-status-${index}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', marginRight: '2rem' }}>
                        <div style={{ marginRight: '.25rem' }}>{status?.icon ? status.icon : undefined}</div>
                        {status.title}
                      </div>
                      {status?.link ? <Link to={status.link}>{status.count}</Link> : <span>{status.count}</span>}
                    </div>
                  )
                })
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
