/* Copyright Contributors to the Open Cluster Management project */
import { Card, List, ListItem, Text, TextContent, TextVariants } from '@patternfly/react-core'
import * as React from 'react'
import './DocPage.css'

type DocPageProps = {
  listItems: {
    title: string
    content: React.ReactNode
  }[]
}

const DocPage: React.FC<DocPageProps> = ({ listItems }) => {
  return (
    <Card style={{ margin: '2em', padding: '2em' }}>
      <List isPlain isBordered iconSize="large">
        {listItems.map((item) => {
          return (
            <ListItem icon={<span className="ocm-icons">{listItems.indexOf(item) + 1}</span>}>
              <TextContent>
                <Text component={TextVariants.h2}>{item.title}</Text>
                {item.content}
              </TextContent>
            </ListItem>
          )
        })}
      </List>
    </Card>
  )
}

export default DocPage
