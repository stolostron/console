/* Copyright Contributors to the Open Cluster Management project */
import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Modal, ModalVariant, Button } from '@patternfly/react-core'
import { UnregisterCallback } from 'history'
import isEqual from 'lodash/isEqual'
import { useTranslation } from '../../lib/acm-i18next'
import { useItem } from '@patternfly-labs/react-form-wizard'

const beforeUnloadListener = (event: { preventDefault: () => void; returnValue: string }) => {
  event.preventDefault()
  return (event.returnValue = '')
}

export function LostChangesPrompt(props: { initialData?: any; data?: any }) {
  const { t } = useTranslation()
  const history = useHistory()
  const [isOpen, setIsOpen] = useState(false)
  const [destinationLocation, setDestinationLocation] = useState<any>()

  const resources = useItem()
  const { data = resources, initialData } = props
  const [originalData] = useState(initialData || data)
  const isDirty = !isEqual(data, originalData)

  useEffect(() => {
    let unblock: UnregisterCallback = () => {}

    // if dirty and prompt isn't open
    //  open prompt and block react router
    if (isDirty && !isOpen) {
      unblock = history.block((location, action) => {
        if (action === 'POP') {
          window.history.forward()
        }
        setDestinationLocation(location)
        setIsOpen(true)
        return false
      })
      addEventListener('beforeunload', beforeUnloadListener, { capture: true })
    }

    return () => {
      unblock()
      removeEventListener('beforeunload', beforeUnloadListener, {
        capture: true,
      })
    }
  }, [isDirty, history, isOpen, data])

  const onLeave = () => {
    history.push(destinationLocation)
    setIsOpen(false)
  }
  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      title="Leave creation"
      titleIconVariant="warning"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      actions={[
        <Button key="leave" variant="primary" onClick={onLeave} data-testid="submit-button">
          Leave
        </Button>,
        <Button key="stay" variant="link" onClick={() => setIsOpen(false)} data-testid="cancel-button">
          Stay
        </Button>,
      ]}
      data-testid="leave-cluster-modal"
    >
      {t('changes.maybe.lost')}
    </Modal>
  ) : null
}
