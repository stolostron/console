/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core'

import { AcmExpandableCard } from '../AcmExpandable'

const leftCol = css({
  'margin-bottom': '0px',
  ['@media (max-width:768px)']: {
    'margin-bottom': 'var(--pf-global--gutter--md)',
  },
  'margin-right': 'var(--pf-global--gutter--md)',
})

export type ListItems = {
  key: string
  keyAction?: React.ReactNode
  value?: string | number | React.ReactNode | undefined
}

export function AcmDescriptionList(
  props: Readonly<{
    id?: string
    title: string
    leftItems: ListItems[]
    rightItems?: ListItems[]
    defaultOpen?: boolean
  }>
) {
  return (
    <AcmExpandableCard id={props.id} title={props.title} defaultOpen={props.defaultOpen}>
      <Grid sm={12} md={props.rightItems ? 6 : 12}>
        <GridItem className={leftCol}>
          <List items={props.leftItems} />
        </GridItem>
        {props.rightItems && (
          <GridItem>
            <List items={props.rightItems} />
          </GridItem>
        )}
      </Grid>
    </AcmExpandableCard>
  )
}

const List = (props: { items: ListItems[] }) => {
  return (
    <DescriptionList isHorizontal>
      {props.items.map(({ key, keyAction, value }) => (
        <DescriptionListGroup key={key}>
          <DescriptionListTerm>
            {key} {keyAction}
          </DescriptionListTerm>
          <DescriptionListDescription>{value ?? '-'}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  )
}
