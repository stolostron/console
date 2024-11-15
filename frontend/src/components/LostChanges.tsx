/* Copyright Contributors to the Open Cluster Management project */
import {
  createContext,
  useState,
  useEffect,
  PropsWithChildren,
  useCallback,
  useMemo,
  useContext,
  Dispatch,
} from 'react'
import { useNavigate, Location } from 'react-router-dom-v5-compat'
import { Modal, ModalVariant, Button } from '@patternfly/react-core'
import isEqual from 'lodash/isEqual'
import { useTranslation } from '../lib/acm-i18next'
import { noop } from 'lodash'
import { useItem } from '@patternfly-labs/react-form-wizard'

export type LostChangesContext = {
  setDirty: Dispatch<boolean>
  setNestedDirty: Dispatch<boolean>
  submitForm: () => void
  cancelForm: (callback?: () => void) => void
  data: unknown
  setData: Dispatch<unknown>
}

export const LostChangesContext = createContext<LostChangesContext>({
  setDirty: noop,
  setNestedDirty: noop,
  submitForm: noop,
  cancelForm: (callback) => callback?.(),
  data: undefined,
  setData: noop,
})

// const beforeUnloadListener = (event: { preventDefault: () => void; returnValue: string }) => {
//   event.preventDefault()
//   event.returnValue = ''
//   return event.returnValue
// }

export function LostChangesPrompt(props: {
  isNested?: boolean
  dirty?: boolean
  data?: unknown
  initialData?: unknown
}) {
  const { isNested, dirty, data, initialData } = props
  const { setDirty, setNestedDirty, data: contextData } = useContext(LostChangesContext)
  const [originalData] = useState(initialData ?? data)
  const newData = data ?? contextData
  const isDirty = dirty ?? !isEqual(newData, originalData)

  if (isNested) {
    setNestedDirty(isDirty)
  } else {
    setDirty(isDirty)
  }

  useEffect(() => {
    return () => (isNested ? setNestedDirty(false) : setDirty(false))
  }, [isNested, setDirty, setNestedDirty])

  return null
}

export function LostChangesMonitor() {
  const { setData } = useContext(LostChangesContext)
  const item = useItem()
  setData(item)
  return null
}

export function LostChangesProvider(props: Readonly<PropsWithChildren>) {
  const [isOpen, setIsOpen] = useState(false)
  const [location, setLocation] = useState<Location<unknown>>()
  const [callback, setCallback] = useState<() => void>()
  const [data, setData] = useState<unknown>()
  const [dirty, setDirty] = useState(false)
  const [nestedDirty, setNestedDirty] = useState(false)

  const navigate = useNavigate()
  const { t } = useTranslation()

  // const historyUnblockRef = useRef<UnregisterCallback>()

  const unblock = useCallback(() => {
    // historyUnblockRef.current?.()
    // removeEventListener('beforeunload', beforeUnloadListener, {
    //   capture: true,
    // })
  }, [])

  useEffect(() => {
    if (dirty || nestedDirty) {
      // historyUnblockRef.current = history.block((location) => {
      //   setIsOpen(true)
      //   setLocation(location)
      //   return false
      // })
      // addEventListener('beforeunload', beforeUnloadListener, { capture: true })
    }
    return unblock
  }, [dirty, nestedDirty, unblock])

  const submitForm = useCallback(() => {
    unblock()
  }, [unblock])

  const cancelForm = useCallback(
    (callback?: () => void) => {
      // This function determines all form cancel behaviour
      // - To warn about dirty forms, launch the modal if callback is provided and the nested form is dirty; do nothing otherwise
      // - To ignore dirty forms on form cancel, just call callback if present or unblock otherwise
      if (callback) {
        if (nestedDirty) {
          setIsOpen(true)
          setCallback(() => callback)
        } else {
          callback()
        }
      }
    },
    [nestedDirty]
  )

  const lostChangesContext = useMemo<LostChangesContext>(
    () => ({ setDirty, setNestedDirty, submitForm, cancelForm, data, setData }),
    [submitForm, cancelForm, data]
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setLocation(undefined)
    setCallback(undefined)
  }, [])

  const leave = useCallback(() => {
    close()
    if (location) {
      unblock()
      navigate(location)
    } else if (callback) {
      callback()
    }
  }, [callback, close, location, navigate, unblock])

  return (
    <LostChangesContext.Provider value={lostChangesContext}>
      {isOpen && (
        <Modal
          variant={ModalVariant.small}
          title={t('Leave form?')}
          titleIconVariant="warning"
          isOpen={isOpen}
          onClose={close}
          actions={[
            <Button key="leave" variant="primary" onClick={leave} data-testid="submit-button">
              {t('Leave')}
            </Button>,
            <Button key="stay" variant="link" onClick={close} data-testid="cancel-button">
              {t('Stay')}
            </Button>,
          ]}
          data-testid="leave-cluster-modal"
        >
          {t('changes.maybe.lost')}
        </Modal>
      )}
      {props.children}
    </LostChangesContext.Provider>
  )
}
