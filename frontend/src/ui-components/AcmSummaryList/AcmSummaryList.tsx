/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  ContentVariants,
  Divider,
  Flex,
  FlexItem,
  Skeleton,
  Split,
  SplitItem,
} from '@patternfly/react-core'
import { Link } from 'react-router-dom-v5-compat'

const cardBody = css({ borderTop: '1px solid rgba(0,0,0,0.1)' })
const divider = css({ marginBottom: '6px' })

type AcmSummaryListProps = {
  title: string
  list: SummarySectionProps[]
  loading?: boolean
}

export const SkeletonWrapper = (title: string) => {
  return (
    <Card>
      <Flex>
        <FlexItem>
          <CardTitle>{title}</CardTitle>
        </FlexItem>
      </Flex>
      <Divider />

      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <FlexItem key={i}>
            <Card>
              <CardBody>
                <Skeleton width="50px" fontSize="3xl" className={divider} />
                <Skeleton width="100px" fontSize="sm" />
              </CardBody>
            </Card>
          </FlexItem>
        ))}
      </Flex>
    </Card>
  )
}

export function AcmSummaryList(props: AcmSummaryListProps) {
  if (props.loading) return SkeletonWrapper(props.title)
  return (
    <Card>
      <Split>
        <SplitItem>
          <Flex>
            <FlexItem>
              <CardTitle>{props.title}</CardTitle>
            </FlexItem>
          </Flex>
        </SplitItem>
      </Split>
      <div className={cardBody}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          {props.list.map((item) => (
            <FlexItem key={item.description} span={3}>
              <SummarySection {...item} />
            </FlexItem>
          ))}
        </Flex>
      </div>
    </Card>
  )
}

const sectionStyles = {
  card: css({
    border: 'none !important',
    height: '100%',
    maxWidth: '185px',
    minWidth: '130px',
  }),
  cardBody: css({
    paddingLeft: '34px',
  }),
  count: css({
    fontSize: '28px',
    '& a': {
      textDecoration: 'none !important',
      fontColor: 'var(--pf-t--global--text--color--regular)',
    },
  }),
  description: css({
    fontSize: '14px',
    fontWeight: 600,
  }),
  divider: css({ marginBottom: '6px' }),
}

type SummarySectionProps = {
  count: number
  description: string
  href?: string
  isLoading?: boolean
}

const SummarySection = (props: SummarySectionProps) => {
  return (
    <Card
      component="div"
      className={sectionStyles.card}
      id={`${props.description.toLowerCase().replaceAll(/\s+/g, '-')}-summary`}
    >
      {props.isLoading ? (
        <CardBody className={sectionStyles.cardBody}>
          <Skeleton id={`loading-${props.description}`} width="50px" fontSize="3xl" className={sectionStyles.divider} />
          <Skeleton width="100px" fontSize="sm" />
        </CardBody>
      ) : (
        <CardBody className={sectionStyles.cardBody}>
          <Content component={ContentVariants.p} className={sectionStyles.count}>
            {props.href ? <Link to={props.href}>{props.count}</Link> : props.count}
          </Content>
          <Content component={ContentVariants.p} className={sectionStyles.description}>
            {props.description}
          </Content>
        </CardBody>
      )}
    </Card>
  )
}
