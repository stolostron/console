/* Copyright Contributors to the Open Cluster Management project */

import {
  DefaultDataContext,
  EditorValidationStatus,
  EditorValidationStatusContext,
  ItemContext,
} from '@patternfly-labs/react-form-wizard'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { APPLICATION_SET_GITOPS_MODEL_ANNOTATION } from '~/resources/application-set'
import { WizardSyncEditor } from './EditArgoApplicationSet'

const agentApplicationSet = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'ApplicationSet',
  metadata: {
    name: 'guestbook',
    namespace: 'openshift-gitops',
    annotations: { [APPLICATION_SET_GITOPS_MODEL_ANNOTATION]: 'agent' },
  },
  spec: {
    generators: [{ list: { elements: [] } }],
    template: {
      metadata: { name: 'guestbook-{{name}}', labels: { 'velero.io/exclude-from-backup': 'true' } },
      spec: { project: 'default', destination: { name: '{{name}}', namespace: 'guestbook' }, sources: [] },
    },
  },
}

test('keeps pull validation when the Agent annotation is removed while editing', async () => {
  const user = userEvent.setup()
  const setEditorValidationStatus = jest.fn()
  const { container } = render(
    <EditorValidationStatusContext.Provider
      value={{ editorValidationStatus: EditorValidationStatus.success, setEditorValidationStatus }}
    >
      <DefaultDataContext.Provider value={[agentApplicationSet]}>
        <ItemContext.Provider value={[agentApplicationSet]}>
          <WizardSyncEditor isPullModel />
        </ItemContext.Provider>
      </DefaultDataContext.Provider>
    </EditorValidationStatusContext.Provider>
  )
  await waitFor(() => expect(setEditorValidationStatus).toHaveBeenLastCalledWith(EditorValidationStatus.success))
  expect(await axe(container)).toHaveNoViolations()

  const editor = screen.getByRole('textbox', { name: 'monaco' }) as HTMLTextAreaElement
  const originalYaml = editor.value
  const annotationLine = '    apps.open-cluster-management.io/gitops-model: agent\n'
  const annotationStart = originalYaml.indexOf(annotationLine)
  expect(annotationStart).toBeGreaterThan(0)
  const missingAnnotationYaml = originalYaml.replace(annotationLine, '')
  await user.type(editor, '{Backspace}', {
    initialSelectionStart: annotationStart,
    initialSelectionEnd: annotationStart + annotationLine.length,
  })
  expect(editor).toHaveValue(missingAnnotationYaml)
  await waitFor(() => expect(setEditorValidationStatus).toHaveBeenLastCalledWith(EditorValidationStatus.failure))

  await user.paste(annotationLine)
  expect(editor).toHaveValue(originalYaml)
  await waitFor(() => expect(setEditorValidationStatus).toHaveBeenLastCalledWith(EditorValidationStatus.success))
})

test('allows an ordinary Push ApplicationSet with a named destination and no Agent annotation', async () => {
  const setEditorValidationStatus = jest.fn()
  render(
    <EditorValidationStatusContext.Provider
      value={{ editorValidationStatus: EditorValidationStatus.success, setEditorValidationStatus }}
    >
      <ItemContext.Provider
        value={[{ ...agentApplicationSet, metadata: { name: 'guestbook', namespace: 'openshift-gitops' } }]}
      >
        <WizardSyncEditor />
      </ItemContext.Provider>
    </EditorValidationStatusContext.Provider>
  )
  await waitFor(() => expect(setEditorValidationStatus).toHaveBeenLastCalledWith(EditorValidationStatus.success))
})
