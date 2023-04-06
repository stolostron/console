/* Copyright Contributors to the Open Cluster Management project */
import { Card, List, ListItem, Page, PageGroup, Text, TextContent, TextVariants } from '@patternfly/react-core'
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
  breadcrumbs: ICatalogBreadcrumb[]
  onCancel: () => void
  onBack: () => void
}

const DocPage: React.FC<DocPageProps> = ({ listItems, breadcrumbs, onCancel, onBack }) => {
  const { t } = useTranslation()
  return (
    <Page>
      <PageHeader
        title={t('Create cluster')}
        breadcrumbs={breadcrumbs}
        titleHelp={
          <>
            {t('page.header.create-cluster.tooltip')}
            <a
              href={DOC_LINKS.CREATE_CLUSTER}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', marginTop: '4px' }}
            >
              {t('learn.more')}
            </a>
          </>
        }
      />
      <Card style={{ margin: '2em', padding: '2em' }}>
        <List isPlain isBordered iconSize="large">
          {listItems.map((item) => {
            return (
              <ListItem key={item.title} icon={<span className="ocm-icons">{listItems.indexOf(item) + 1}</span>}>
                <TextContent>
                  <Text component={TextVariants.h2}>{item.title}</Text>
                  {item.content}
                </TextContent>
              </ListItem>
            )
          })}
        </List>
      </Card>
      <PageGroup sticky="bottom" style={{ height: '68px' }}>
        <DocPageToolbar onBack={onBack} onCancel={onCancel} />
      </PageGroup>
    </Page>
  )
}

export default DocPage
