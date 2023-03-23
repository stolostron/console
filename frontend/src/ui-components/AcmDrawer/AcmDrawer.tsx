/* Copyright Contributors to the Open Cluster Management project */

import { useRef, useState, useContext, useEffect, createContext } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Drawer,
  DrawerPanelContent,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelBody,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DrawerPanelContentProps,
} from '@patternfly/react-core'
import { AcmAlertProvider, AcmAlertContext } from '../AcmAlert/AcmAlert'

export const AcmDrawerContext = createContext<{
  drawerContext?: AcmDrawerProps
  setDrawerContext: React.Dispatch<React.SetStateAction<AcmDrawerProps | undefined>>
}>({
  drawerContext: undefined,
  setDrawerContext: /* istanbul ignore next */ () => undefined,
})

export function AcmDrawerProvider(props: { children: React.ReactNode | React.ReactNode[] }) {
  const [drawerContext, setDrawerContext] = useState<AcmDrawerProps | undefined>()

  // close the drawer on location changes
  const history = useHistory()
  const historyListener = history.listen(() => setDrawerContext(undefined))
  useEffect(() => {
    return () => historyListener()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AcmDrawerContext.Provider value={{ drawerContext, setDrawerContext }}>{props.children}</AcmDrawerContext.Provider>
  )
}

export type AcmDrawerProps = {
  isExpanded?: boolean
  isInline?: boolean
  onCloseClick?: () => void
  title?: string | React.ReactNode
  children?: React.ReactNode | React.ReactNode[]
  panelContent?: React.ReactNode | React.ReactNode[]
  panelContentProps?: DrawerPanelContentProps
  isResizable?: boolean
  disableDrawerHead?: boolean
  drawerPanelBodyHasNoPadding?: boolean
}

export function AcmDrawer(props: AcmDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const { drawerContext } = useContext(AcmDrawerContext)

  /* istanbul ignore next */
  const isExpanded = props?.isExpanded ?? drawerContext?.isExpanded
  /* istanbul ignore next */
  const isInline = props?.isInline ?? drawerContext?.isInline
  /* istanbul ignore next */
  const onCloseClick = props?.onCloseClick ?? drawerContext?.onCloseClick
  /* istanbul ignore next */
  const title = props?.title ?? drawerContext?.title
  /* istanbul ignore next */
  const panelContent = props?.panelContent ?? drawerContext?.panelContent
  /* istanbul ignore next */
  const panelContentProps = props?.panelContentProps ?? drawerContext?.panelContentProps ?? {}
  /* istanbul ignore next */
  const isResizable = props?.isResizable ?? drawerContext?.isResizable
  /* istanbul ignore next */
  const disableDrawerHead = props?.disableDrawerHead ?? drawerContext?.disableDrawerHead
  /* istanbul ignore next */
  const drawerPanelBodyHasNoPadding = props?.drawerPanelBodyHasNoPadding ?? drawerContext?.drawerPanelBodyHasNoPadding

  return (
    <Drawer
      isExpanded={isExpanded}
      isInline={isInline}
      onExpand={/* istanbul ignore next */ () => drawerRef?.current?.focus()}
    >
      <DrawerContent
        colorVariant="default"
        style={{ backgroundColor: 'unset' }}
        panelContent={
          <AcmAlertProvider>
            <AcmDrawerPanelContent
              isExpanded={isExpanded}
              onCloseClick={onCloseClick}
              panelContent={panelContent}
              panelContentProps={panelContentProps}
              title={title}
              drawerRef={drawerRef}
              isResizable={isResizable}
              disableDrawerHead={disableDrawerHead}
              drawerPanelBodyHasNoPadding={drawerPanelBodyHasNoPadding}
            />
          </AcmAlertProvider>
        }
      >
        <DrawerContentBody>{props.children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  )
}

function AcmDrawerPanelContent(props: AcmDrawerProps & { drawerRef: React.RefObject<HTMLDivElement> }) {
  const alertContext = useContext(AcmAlertContext)
  useEffect(() => {
    if (props.isExpanded === undefined || props.isExpanded === false) {
      alertContext.clearAlerts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isExpanded])

  return (
    <DrawerPanelContent isResizable={props.isResizable} {...props.panelContentProps}>
      {!props.disableDrawerHead && (
        <DrawerHead>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div ref={props.drawerRef} tabIndex={0} style={{ fontSize: '24px', outline: 'none' }}>
            {props.title}
          </div>
          <DrawerActions>
            <DrawerCloseButton onClick={props.onCloseClick} />
          </DrawerActions>
        </DrawerHead>
      )}
      <DrawerPanelBody hasNoPadding={props.drawerPanelBodyHasNoPadding}>
        {props.disableDrawerHead && (
          <DrawerActions>
            <DrawerCloseButton onClick={props.onCloseClick} />
          </DrawerActions>
        )}
        {props.panelContent}
      </DrawerPanelBody>
    </DrawerPanelContent>
  )
}
