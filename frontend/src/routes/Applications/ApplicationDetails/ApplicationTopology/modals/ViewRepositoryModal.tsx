/* Copyright Contributors to the Open Cluster Management project */

import { Alert, Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import { FolderOpenIcon, GitAltIcon } from '@patternfly/react-icons'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SyncEditor } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { AcmModal } from '~/ui-components'
import { getGitBlobContents } from '~/resources'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import type { TopologyNode } from '../types'
import { findRepositorySecretAccess, getViewTitle } from '../helpers/repositoryNavigatorHelpers'
import { ModalNavigatorLayout } from './ModalNavigatorLayout'
import { RepositoryNavigator, type RepositoryNavigatorFileItem } from './RepositoryNavigator'
import './ResourceNavigator.css'
import { getTheme } from '~/components/theme'

export interface IViewRepositoryModalProps {
  close: () => void
  open: boolean
  node: TopologyNode
}

const EXTENSION_LANGUAGE_MAP: Record<string, Language> = {
  yaml: Language.yaml,
  yml: Language.yaml,
  json: Language.json,
  js: Language.javascript,
  jsx: Language.javascript,
  ts: Language.typescript,
  tsx: Language.typescript,
  md: Language.markdown,
  sh: Language.shell,
  xml: Language.xml,
  html: Language.html,
  htm: Language.html,
}

function getLanguageForPath(path: string): Language {
  const segments = path.split('.')
  const extension = segments.length > 1 ? segments.at(-1)!.toLowerCase() : ''
  return EXTENSION_LANGUAGE_MAP[extension] ?? Language.plaintext
}

type FileContentsState =
  | { file: RepositoryNavigatorFileItem; status: 'loaded'; contents: string }
  | { file: RepositoryNavigatorFileItem; status: 'error' }

export function ViewRepositoryModal(props: IViewRepositoryModalProps | { open: false }) {
  if (props.open === false) {
    return null
  }

  return <ViewRepositoryModalContent {...props} />
}

function ViewRepositoryModalContent({ close, node }: Readonly<Omit<IViewRepositoryModalProps, 'open'>>) {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<RepositoryNavigatorFileItem | undefined>(undefined)
  const [noFilesFound, setNoFilesFound] = useState(false)
  const [isRepositoryLoading, setIsRepositoryLoading] = useState(true)
  const [fileContents, setFileContents] = useState<FileContentsState>()
  const { secretsState } = useSharedAtoms()
  const secrets = useSharedValue(secretsState)
  const secretAccess = useMemo(
    () => (selectedFile ? findRepositorySecretAccess(selectedFile.repoURL, secrets) : undefined),
    [selectedFile, secrets]
  )
  const isFileLoading = !!selectedFile && fileContents?.file !== selectedFile
  const modalTitle = (node.name as string) || t('Repository')
  const selectedFileLanguage = selectedFile ? getLanguageForPath(selectedFile.path) : undefined

  useEffect(() => {
    if (!selectedFile) return
    let cancelled = false
    setFileContents(undefined)
    getGitBlobContents(selectedFile.url, secretAccess?.secretArgs, secretAccess?.accessData).then(
      (contents) => {
        if (!cancelled) setFileContents({ file: selectedFile, status: 'loaded', contents })
      },
      () => {
        if (!cancelled) setFileContents({ file: selectedFile, status: 'error' })
      }
    )
    return () => {
      cancelled = true
    }
  }, [selectedFile, secretAccess])

  const handleSelectItem = useCallback((item: RepositoryNavigatorFileItem) => {
    setSelectedFile(item)
  }, [])

  const handleNoFilesFound = useCallback(() => {
    setNoFilesFound(true)
  }, [])

  const handleRepositoryLoadingChange = useCallback((isLoading: boolean) => {
    setIsRepositoryLoading(isLoading)
  }, [])

  let content: ReactNode = null
  if (isRepositoryLoading || isFileLoading || (!selectedFile && !noFilesFound)) {
    content = (
      <Bullseye>
        <Spinner size="xl" aria-label={t('Loading')} />
      </Bullseye>
    )
  } else if (fileContents?.status === 'error') {
    content = <Alert variant="danger" isInline title={t('Failed to load repository file.')} />
  } else if (selectedFile && fileContents?.status === 'loaded') {
    if (selectedFileLanguage === Language.yaml) {
      content = (
        <SyncEditor
          editorTitle={getViewTitle(selectedFile.id)}
          variant="toolbar"
          code={fileContents.contents}
          resources={null}
          readonly
          initialShowChanges={false}
        />
      )
    } else {
      content = (
        <CodeEditor
          code={fileContents.contents}
          language={selectedFileLanguage}
          isCopyEnabled
          isFullHeight
          isLineNumbersVisible
          isReadOnly
          options={{
            theme: getTheme(),
            wordWrap: 'wordWrapColumn',
            scrollBeyondLastLine: true,
            smoothScrolling: true,
            glyphMargin: true,
            tabSize: 2,
            scrollbar: {
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17,
            },
            minimap: {
              enabled: false,
            },
          }}
        />
      )
    }
  } else if (noFilesFound) {
    content = (
      <Bullseye>
        <EmptyState titleText={t('No files found')} variant="sm" icon={FolderOpenIcon}>
          <EmptyStateBody>{t('This repository does not contain any files to display.')}</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    )
  }

  return (
    <AcmModal
      id="view-repository-modal"
      isOpen={true}
      title={modalTitle}
      titleIconVariant={GitAltIcon}
      aria-label={t('View repository')}
      showClose={true}
      onClose={close}
      variant={ModalVariant.large}
      position="top"
      hasNoBodyWrapper
    >
      <div className="resource-modal-body resource-modal-body--padded-bottom">
        <ModalNavigatorLayout
          navigator={
            <RepositoryNavigator
              node={node}
              selectedItemId={selectedFile?.id}
              onSelectItem={handleSelectItem}
              onNoFilesFound={handleNoFilesFound}
              onLoadingChange={handleRepositoryLoadingChange}
            />
          }
        >
          <div style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{content}</div>
        </ModalNavigatorLayout>
      </div>
    </AcmModal>
  )
}
