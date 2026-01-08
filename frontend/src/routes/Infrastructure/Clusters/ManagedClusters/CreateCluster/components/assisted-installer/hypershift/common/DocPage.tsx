/* Copyright Contributors to the Open Cluster Management project */
import { Card, Content, ContentVariants, List, ListItem, PageGroup } from '@patternfly/react-core'
import { ICatalogBreadcrumb, PageHeader } from '@stolostron/react-data-view'
import * as React from 'react'
import { useTranslation } from '../../../../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../../../../lib/doc-util'
import './DocPage.css'
import DocPageToolbar from './DocPageToolbar'

type DocPageProps = {
  listItems: {
    title: string
    content: React.ReactNode
  }[]
  breadcrumbs?: ICatalogBreadcrumb[]
  onCancel?: () => void
  onBack?: () => void
  noMargin?: boolean
}

const DocPage: React.FC<DocPageProps> = ({ listItems, breadcrumbs, onCancel, onBack, noMargin }) => {
  const { t } = useTranslation()
  return (
    <>
      {breadcrumbs ? (
        <PageHeader
          title={t('Create cluster')}
          breadcrumbs={breadcrumbs}
          titleHelp={
            <>
              {t('page.header.create-cluster.tooltip')}
              <a
                href={DOC_LINKS.HYPERSHIFT_DEPLOY_AWS}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: '4px' }}
              >
                {t('learn.more')}
              </a>
            </>
          }
        />
      ) : (
        ''
      )}

      <Card isPlain style={{ margin: noMargin ? 0 : '2em', padding: '2em' }}>
        <List isPlain isBordered iconSize="large">
          {listItems.map((item) => {
            return (
              <ListItem key={item.title} icon={<span className="ocm-icons">{listItems.indexOf(item) + 1}</span>}>
                <Content>
                  <Content component={ContentVariants.h2}>{item.title}</Content>
                  {item.content}
                </Content>
              </ListItem>
            )
          })}
        </List>
      </Card>
      {onCancel && onBack ? (
        <PageGroup style={{ height: '68px' }}>
          <DocPageToolbar onBack={onBack} onCancel={onCancel} />
        </PageGroup>
      ) : (
        ''
      )}
    </>
  )
}

export default DocPage
