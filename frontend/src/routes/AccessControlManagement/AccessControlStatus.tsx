/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import { Button, Icon, Popover, PopoverProps, Spinner } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons'
import { TFunction } from 'react-i18next'
import { Condition } from '../../resources/access-control'

const container = css({
  display: 'flex',
})
const icon = css({
  width: '18px', // Progress size md is 18px
})

const button = css({
  padding: 0,
  fontSize: 'inherit',
})

const StatusIcon = ({ condition }: { condition?: Condition }) => {
  switch (true) {
    case !condition:
      return <Spinner size="md" style={{ verticalAlign: 'middle' }} />
    case condition?.status === 'True':
      return (
        <Icon status="success">
          <CheckCircleIcon />
        </Icon>
      )
    case condition?.status === 'False':
      return (
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      )
  }
}

const AccessControlStatus = ({
  condition,
  popover,
  t,
}: {
  condition?: Condition
  popover?: PopoverProps
  t: TFunction
}) => (
  <div className={container} style={{ alignItems: 'baseline' }}>
    <div className={icon}>
      <StatusIcon condition={condition} />
    </div>
    {condition ? (
      <span style={{ marginLeft: 'inherit' }}>
        <Popover hasAutoWidth {...popover} bodyContent={condition.message}>
          <Button variant="link" className={button} style={{ paddingLeft: '5px' }}>
            {t(`accessControl.status.${condition.reason}`)}
          </Button>
        </Popover>
      </span>
    ) : null}
  </div>
)

export { AccessControlStatus }
