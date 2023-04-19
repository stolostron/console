/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles, ClassNameMap } from '@mui/styles'
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

const useStyles = makeStyles({
  /* istanbul ignore next */
  parentContainer: {
    display: 'flex',
    paddingTop: '10px',
  },
  popoverParentContainer: {
    display: 'inline-grid',
  },
  popoverBody: {
    display: 'flex',
  },
  stepContainer: {
    display: 'inline-flex',
    padding: '10px 0px 10px 0px',
  },
  text: { width: 'max-content' },
  divider: {
    padding: '0px 40px 0px 40px',
    maxWidth: '180px',
    maxHeight: '20px',
  },
  stepStatus: {
    paddingLeft: '25px',
  },
  container: {
    display: 'flex',
  },
  icon: {
    width: '18px', // Progress size md is 18px
  },
  iconMargin: {
    margin: '3px 2px 1px 2px',
  },
  button: {
    paddingLeft: '25px',
  },
})

const divider = (classes: ClassNameMap) => {
  return (
    <svg className={classes.divider}>
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
  const classes = useStyles()
  const { viewWidth } = useViewport()
  const isStacked = props.isStacked || viewWidth < 700

  return (
    <Fragment>
      <TextContent>
        <Text component="h3">{props.Title}</Text>
        <Text component="small">{props.Subtitle}</Text>
      </TextContent>

      <Gallery className={isStacked ? classes.popoverParentContainer : classes.parentContainer}>
        {props.steps.map((step, index) => (
          <GalleryItem key={index} className={classes.stepContainer}>
            <div>
              <AcmInlineStatus type={step.statusType} status={step.statusText} />
              <TextContent>
                <Text className={classes.stepStatus} component="small">
                  {step.statusSubtitle}
                </Text>
              </TextContent>
              {step.link && (
                <AcmButton
                  id={step.stepID && `${step.stepID}-link`}
                  className={classes.button}
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
            {!isStacked && index < props.steps.length - 1 && divider(classes)}
          </GalleryItem>
        ))}
      </Gallery>
    </Fragment>
  )
}
