/* Copyright Contributors to the Open Cluster Management project */

import { Fragment } from 'react'
import { Flex, FlexItem, Divider } from '@patternfly/react-core'
import { css } from '@emotion/css'

const group = css({
  '& > div > a, & .pf-v5-c-dropdown__toggle.pf-m-plain': {
    paddingLeft: 0,
    paddingRight: 0,
  },
})

export function AcmActionGroup(props: { children: React.ReactNode[] }) {
  return (
    <Flex className={group}>
      {props.children
        .filter((child) => !!child)
        .map((child, i) => {
          if (i === 0) {
            return <FlexItem key={i}>{child}</FlexItem>
          } else {
            return (
              <Fragment key={i}>
                <Divider orientation={{ default: 'vertical' }} />
                <FlexItem>{child}</FlexItem>
              </Fragment>
            )
          }
        })}
    </Flex>
  )
}
