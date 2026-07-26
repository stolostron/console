/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '../../../../../resources'
import { patchResource } from '../../../../../resources/utils'
import {
  AcmAlertContext,
  AcmAlertGroup,
  AcmForm,
  AcmModal,
  AcmSubmit,
  IAlertContext,
} from '../../../../../ui-components'
import {
  ActionGroup,
  Button,
  FormGroup,
  TextArea,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, TrashIcon } from '@patternfly/react-icons'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { getErrorInfo } from '../../../../../components/ErrorPage'

const CLUSTER_DESCRIPTION_ANNOTATION = 'console.open-cluster-management.io/description'

export function EditDescription(props: Readonly<{ resource?: IResource; close: () => void }>) {
  const { t } = useTranslation()
  const [description, setDescription] = useState<string>('')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const isOpen = props.resource !== undefined

  useEffect(() => {
    if (isOpen) {
      const desc = props.resource?.metadata?.annotations?.[CLUSTER_DESCRIPTION_ANNOTATION] ?? ''
      setDescription(desc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSave = (alertContext: IAlertContext) => {
    alertContext.clearAlerts()
    const resourceToPatch: IResource = {
      apiVersion: props.resource!.apiVersion,
      kind: props.resource!.kind,
      metadata: {
        name: props.resource!.metadata!.name,
        namespace: props.resource!.metadata?.namespace,
      },
    }

    const patch = {
      metadata: {
        annotations: {
          [CLUSTER_DESCRIPTION_ANNOTATION]: description.trim() || null,
        },
      },
    }

    return patchResource(resourceToPatch, patch)
      .promise.then(() => {
        props.close()
      })
      .catch((err) => {
        alertContext.addAlert(getErrorInfo(err, t))
      })
  }

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    const textarea = textAreaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = description.substring(start, end)
    const beforeText = description.substring(0, start)
    const afterText = description.substring(end)

    const newText = beforeText + prefix + selectedText + suffix + afterText
    setDescription(newText)

    // Place cursor between opening and closing markdown markers (e.g., **|** for typing)
    setTimeout(() => {
      const scrollPosition = textarea.scrollTop
      textarea.focus()
      const newPosition = start + prefix.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.scrollTop = scrollPosition
    }, 0)
  }

  return (
    <AcmModal
      title={t('Edit cluster description')}
      isOpen={props.resource !== undefined}
      variant={ModalVariant.medium}
      onClose={props.close}
    >
      <AcmAlertContext.Consumer>
        {(alertContext) => (
          <AcmForm style={{ gap: 0 }}>
            <div style={{ marginBottom: 16 }}>
              {t(
                'Add links and notes your team uses for this cluster. Use Markdown to format text; formatting is applied when you save.'
              )}
            </div>
            <FormGroup fieldId="description-input">
              <Toolbar>
                <ToolbarContent>
                  <ToolbarGroup>
                    <ToolbarItem>
                      <Tooltip content={t('Bold')}>
                        <Button variant="plain" aria-label={t('Bold')} onClick={() => insertMarkdown('**')}>
                          <BoldIcon />
                        </Button>
                      </Tooltip>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Tooltip content={t('Italic')}>
                        <Button variant="plain" aria-label={t('Italic')} onClick={() => insertMarkdown('*')}>
                          <ItalicIcon />
                        </Button>
                      </Tooltip>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Tooltip content={t('Link')}>
                        <Button variant="plain" aria-label={t('Link')} onClick={() => insertMarkdown('[', '](url)')}>
                          <LinkIcon />
                        </Button>
                      </Tooltip>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Tooltip content={t('List')}>
                        <Button
                          variant="plain"
                          aria-label={t('List')}
                          onClick={() => {
                            const start = textAreaRef.current?.selectionStart ?? 0
                            const prefix = start === 0 || description[start - 1] === '\n' ? '- ' : '\n- '
                            insertMarkdown(prefix, '')
                          }}
                        >
                          <ListIcon />
                        </Button>
                      </Tooltip>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button
                        variant="plain"
                        aria-label={t('Clear')}
                        onClick={() => {
                          setDescription('')
                          textAreaRef.current?.focus()
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </ToolbarItem>
                  </ToolbarGroup>
                </ToolbarContent>
              </Toolbar>

              <TextArea
                ref={textAreaRef}
                id="description-input"
                value={description}
                onChange={(_event, value) => setDescription(value)}
                rows={10}
                resizeOrientation="none"
                placeholder={t('Enter cluster description')}
                aria-label={t('Description')}
              />
            </FormGroup>
            <AcmAlertGroup isInline canClose />
            <ActionGroup>
              <AcmSubmit
                id="save-description"
                variant="primary"
                onClick={() => handleSave(alertContext)}
                label={t('save')}
                processingLabel={t('saving')}
              />
              <Button variant="link" onClick={props.close}>
                {t('cancel')}
              </Button>
            </ActionGroup>
          </AcmForm>
        )}
      </AcmAlertContext.Consumer>
    </AcmModal>
  )
}
