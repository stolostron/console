/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Gallery, GalleryItem, PopoverProps, Text, TextContent } from '@patternfly/react-core'
import { Fragment } from 'react'
import { useViewport } from '../AcmCharts/AcmChartGroup'
import { AcmInlineStatus, StatusType } from '../AcmInlineStatus'
import { AcmButton } from '../AcmButton'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export type AcmProgressTrackerProps = {
  steps: ProgressTrackerStep[]
  isCentered?: boolean
  Title: string
  Subtitle: string
  isStatusPopover?: boolean
  isStacked?: boolean
}

export type ProgressTrackerStep = {
  statusType: StatusType
  statusText: string | React.ReactNode
  popover?: PopoverProps
  statusSubtitle?: string
  link?: ProgressTrackerStepLink
  stepID?: string
}

export type ProgressTrackerStepLink = {
  linkUrl?: string
  linkName: string
  isDisabled?: boolean
  linkCallback?: () => void
}

const parentContainer = css({
  display: 'flex',
  paddingTop: '10px',
})
const popoverParentContainer = css({
  display: 'inline-grid',
})
const stepContainer = css({
  display: 'inline-flex',
  padding: '10px 0px 10px 0px',
})
const dividerClass = css({
  padding: '0px 40px 0px 40px',
  maxWidth: '180px',
  maxHeight: '20px',
})
const stepStatus = css({
  paddingLeft: '25px',
})
const button = css({
  paddingLeft: '25px',
})

const Divider = () => {
  return (
    <svg className={dividerClass}>
      <line
        x1="0"
        x2="100"
        y1="10"
        y2="10"
        stroke="#D2D2D2" // --pf-global--palette--black-300
        strokeWidth="2"
        strokeLinecap="square"
        strokeDasharray="1, 3"
      />
    </svg>
  )
}

export function AcmProgressTracker(props: AcmProgressTrackerProps) {
  const { viewWidth } = useViewport()
  const isStacked = props.isStacked || viewWidth < 700

  return (
    <Fragment>
      <TextContent>
        <Text component="h3">{props.Title}</Text>
        <Text component="small">{props.Subtitle}</Text>
      </TextContent>

      <Gallery className={isStacked ? popoverParentContainer : parentContainer}>
        {props.steps.map((step, index) => (
          <GalleryItem key={step.stepID} className={stepContainer}>
            <div>
              <AcmInlineStatus type={step.statusType} status={step.statusText} />
              <TextContent>
                <Text className={stepStatus} component="small">
                  {step.statusSubtitle}
                </Text>
              </TextContent>
              {step.link && (
                <AcmButton
                  id={step.stepID && `${step.stepID}-link`}
                  className={button}
                  variant="link"
                  isSmall
                  icon={<ExternalLinkAltIcon />}
                  iconPosition="right"
                  isDisabled={step.link.isDisabled}
                  onClick={() => {
                    /* istanbul ignore next */
                    step.link?.linkUrl && window.open(step.link?.linkUrl)
                    /* istanbul ignore next */
                    step.link?.linkCallback && step.link?.linkCallback()
                  }}
                >
                  {step.link.linkName}
                </AcmButton>
              )}
            </div>
            {!isStacked && index < props.steps.length - 1 && <Divider />}
          </GalleryItem>
        ))}
      </Gallery>
    </Fragment>
  )
}
