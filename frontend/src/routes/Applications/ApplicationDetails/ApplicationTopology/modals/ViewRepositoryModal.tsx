/* Copyright Contributors to the Open Cluster Management project */

import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { Language } from '@patternfly/react-code-editor'
import { FolderOpenIcon } from '@patternfly/react-icons'
import { useCallback, useMemo, useState } from 'react'
import { SyncEditor } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { AcmModal } from '~/ui-components'
import type { TopologyNode } from '../types'
import { buildRepositorySources } from '../helpers/repositoryNavigatorHelpers'
import { typeToShapeMap } from '../model/NodeDetailsProvider'
import { ModalNavigatorLayout } from './ModalNavigatorLayout'
import { ResourceKindDecorator } from './ResourceNavigator'
import { RepositoryNavigator, type RepositoryNavigatorFileItem } from './RepositoryNavigator'
import './ResourceNavigator.css'

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
  const extension = segments.length > 1 ? segments[segments.length - 1].toLowerCase() : ''
  return EXTENSION_LANGUAGE_MAP[extension] ?? Language.plaintext
}

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
  const sources = useMemo(() => buildRepositorySources(node), [node])
  const modalTitle = sources.length === 1 ? sources[0].repoURL : (node.name as string) || t('Repository')

  const handleSelectItem = useCallback((item: RepositoryNavigatorFileItem) => {
    setSelectedFile(item)
  }, [])

  const handleNoFilesFound = useCallback(() => {
    setNoFilesFound(true)
  }, [])

  const { shape: iconShape = 'git', className: iconClassName = 'container' } =
    typeToShapeMap[String(node.type) as keyof typeof typeToShapeMap] || {}
  const TitleIcon = useMemo(
    () =>
      function ViewRepositoryModalTitleIcon() {
        return <ResourceKindDecorator shape={iconShape} className={iconClassName} size={39} />
      },
    [iconShape, iconClassName]
  )

  return (
    <AcmModal
      id="view-repository-modal"
      isOpen={true}
      title={modalTitle}
      titleIconVariant={TitleIcon}
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
            />
          }
        >
          <div style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {selectedFile ? (
              <SyncEditor
                editorTitle={selectedFile.path}
                variant="toolbar"
                code={selectedFile.contents}
                resources={null}
                language={getLanguageForPath(selectedFile.path)}
                readonly
                initialShowChanges={false}
              />
            ) : noFilesFound ? (
              <Bullseye>
                <EmptyState titleText={t('No files found')} variant="sm" icon={FolderOpenIcon}>
                  <EmptyStateBody>{t('This repository does not contain any files to display.')}</EmptyStateBody>
                </EmptyState>
              </Bullseye>
            ) : (
              <Bullseye>
                <Spinner size="xl" aria-label={t('Loading')} />
              </Bullseye>
            )}
          </div>
        </ModalNavigatorLayout>
      </div>
    </AcmModal>
  )
}
