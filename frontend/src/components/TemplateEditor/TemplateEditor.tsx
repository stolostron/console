/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/ban-ts-comment -- legacy TemplateEditor; full types in follow-up */
// @ts-nocheck — extensive Monaco/wizard state; full strict typing deferred

import {
  Button,
  Drawer,
  DrawerColorVariant,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  PageSection,
  Switch,
} from '@patternfly/react-core'
import classNames from 'classnames'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'
import set from 'lodash/set'
import isEqual from 'lodash/isEqual'
import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { LostChangesContext, LostChangesPrompt } from '../LostChanges'
import EditorBar from './components/EditorBar'
import EditorHeader from './components/EditorHeader'
import YamlEditor from './components/YamlEditor'
import Form from './controls/Form'
import './css/template-editor.css'
import { logCreateErrors, logSourceErrors } from './utils/logger'
import { updateEditStack } from './utils/refresh-source-from-stack'
import { highlightAllChanges, highlightChanges, highlightDecorations } from './utils/refresh-source-highlighting'
import {
  cacheUserData,
  cloneControlData,
  generateSource,
  getDecorationData,
  getDecorationRows,
  initializeControls,
  parseYAML,
} from '~/components/TemplateEditor/utils/source-utils'
import { validateControls } from '~/components/TemplateEditor/utils/validate-controls'

const TEMPLATE_EDITOR_OPEN_COOKIE = 'yaml'
const TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE = 'template-editor-show-secrets-cookie'

const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id',
})

function getDerivedStateFromProps(props, state) {
  const { monacoEditor, createControl = {}, type, initialOpen, editorReadOnly } = props
  const { i18n, resourceJSON } = state

  // update notifications
  let { notifications } = state
  const { hasFormExceptions, isEditing } = state
  const { creationStatus, creationMsg, resetStatus } = createControl
  if (creationStatus && !hasFormExceptions) {
    switch (creationStatus) {
      case 'IN_PROGRESS':
        notifications = [
          {
            id: 'creating',
            variant: 'info',
            exception:
              Array.isArray(creationMsg) && creationMsg.length
                ? creationMsg[0]
                : isEditing
                  ? i18n('success.create.updating', [type])
                  : i18n('success.create.creating', [type]),
          },
        ]
        break

      case 'DONE':
        notifications = [
          {
            id: 'success',
            variant: 'success',
            exception:
              Array.isArray(creationMsg) && creationMsg.length
                ? creationMsg[0]
                : isEditing
                  ? i18n('success.create.updated', [type])
                  : i18n('success.create.created', [type]),
          },
        ]
        break

      case 'ERROR':
        logCreateErrors(props.logging, creationMsg, resourceJSON)
        notifications = creationMsg.map((message) => {
          return {
            id: 'create',
            variant: 'danger',
            exception: message.message || message,
          }
        })
        break
    }
    return { notifications }
  }

  // is a resource loaded in editor?
  const { fetchControl } = props
  const { isLoaded, isFailed } = fetchControl || { isLoaded: true }
  /* istanbul ignore next */
  const showEditor = (monacoEditor || initialOpen) && isLoaded && !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE)
  let newState = { isLoaded, isFailed, showEditor }

  // has control data been initialized?
  const { controlData: initialControlData, onControlInitialize } = props
  let { controlData, templateYAML, editStack } = state
  const { editor, template, showSecrets, otherYAMLTabs } = state
  if (!controlData) {
    // initialize control data
    const cd = cloneControlData(initialControlData)
    controlData = initializeControls(cd, editor, onControlInitialize, i18n)
    newState = { ...newState, controlData }

    const showControl = controlData.find(({ id: idCtrl }) => idCtrl === 'showSecrets')
    /* istanbul ignore else */
    if (showControl) {
      showControl.active = showSecrets || !showEditor
    }

    const localHubNameControl = controlData.find(({ id: idCtrl }) => idCtrl === 'localHubName')
    /* istanbul ignore else */
    if (localHubNameControl) {
      localHubNameControl.active = props.localHubName
    }
  }

  // has source been initialized?
  if (isLoaded && !templateYAML) {
    // editing an existing set of resources??
    const customResources = get(fetchControl, 'resources')
    if (customResources) {
      editStack = { customResources: cloneDeep(customResources), editor, i18n }
      editStack.onControlInitialize = onControlInitialize
    }

    // generate source from template or stack of resources
    let templateObject, templateResources, decorationRows
    ;({ templateYAML, templateObject, templateResources, decorationRows } = generateSource(
      template,
      editStack,
      controlData,
      otherYAMLTabs
    ))

    newState = {
      ...newState,
      templateYAML,
      firstTemplateYAML: templateYAML,
      templateObject,
      templateResources,
      editStack,
      resetStatus: typeof resetStatus === 'function' ? resetStatus : () => {},
      isEditing: !!customResources,
      editorReadOnly: state.editorReadOnly || editorReadOnly,
      decorationRows,
    }
  }

  return newState
}

const TemplateEditor = forwardRef<any, any>(function TemplateEditor(props, ref) {
  const lostChangesContext = useContext(LostChangesContext)

  const containerRef = useRef(null)
  const editorPanelRef = useRef(null)
  const renderedPortalsRef = useRef(false)
  const selectedTabRef = useRef(0)
  const isDirtyRef = useRef(false)
  const firstGoToLinePerformedRef = useRef(false)
  const editorsRef = useRef([])
  const selectionsRef = useRef(null)
  const selectionIndexRef = useRef(-1)
  const nameSearchRef = useRef(null)
  const nameSearchModeRef = useRef(false)

  const bumpRef = useRef(() => {})
  const forceGenerateRef = useRef(() => {})
  const stateRef = useRef(null)
  const editorApi = useRef({
    forceUpdate: () => {
      bumpRef.current()
      forceGenerateRef.current()
    },
    currentData: () => stateRef.current?.controlData,
  })

  const [, bump] = useReducer((n) => n + 1, 0)
  bumpRef.current = () => bump()

  const [state, setState] = useState(() => {
    if (props.initialOpen) {
      localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
    }
    const hasStep = !!props.controlData.find(({ type }) => type === 'step')
    const base = {
      isCustomName: false,
      showEditor: !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE),
      showSecrets: !!localStorage.getItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE),
      template: props.template,
      i18n: props.i18n,
      activeYAMLEditor: 0,
      exceptions: [],
      previouslySelectedCards: [],
      notifications: [],
      otherYAMLTabs: [],
      hasFormExceptions: false,
      isFinalValidate: false,
      hasUndo: false,
      hasRedo: false,
      resetInx: 0,
      showCondensed: false,
      editor: editorApi.current,
      showWizard: hasStep,
    }
    const merged = { ...base, ...getDerivedStateFromProps(props, base) }
    stateRef.current = merged
    return merged
  })

  stateRef.current = state

  // Class getDerivedStateFromProps ran on every render; sync when props change.
  // Avoid depending on `state` here — that caused update loops with nested setState (e.g. Popper).
  useEffect(() => {
    setState((s) => {
      const patch = getDerivedStateFromProps(props, s)
      const next = { ...s, ...patch }
      return isEqual(s, next) ? s : next
    })
  }, [props])

  useEffect(() => {
    if (props.initialOpen) {
      localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
    }
  }, [props.initialOpen])

  useEffect(() => {
    if (!renderedPortalsRef.current) {
      const id = window.setTimeout(() => bump(), 0)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [])

  const handleParseRef = useRef(() => {})
  const parseDebounced = useMemo(() => debounce((yaml) => handleParseRef.current(yaml), 500), [])
  useEffect(() => () => parseDebounced.cancel(), [parseDebounced])

  const setContainerRef = (container) => {
    containerRef.current = container
  }

  const setYamlViewRef = () => {
    editorPanelRef.current = document.getElementById('editor-drawer-panel')
    if (window.ResizeObserver && editorPanelRef.current) {
      let timeout
      const resizeObserver = new ResizeObserver(() => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          layoutEditors()
        }, 100)
      })
      resizeObserver.observe(editorPanelRef.current)
    }
  }

  function layoutEditors() {
    editorPanelRef.current = document.getElementById('editor-drawer-panel')
    if (editorPanelRef.current && editorsRef.current.length > 0) {
      const { otherYAMLTabs } = state
      const rect = editorPanelRef.current.getBoundingClientRect()
      const width = rect.width - 10
      let height = window.innerHeight - rect.top
      const header = document.getElementsByClassName('creation-view-yaml-header')[0]
      /* istanbul ignore next */
      if (header) {
        height = height - header.getBoundingClientRect().height
      } else {
        height = height - (otherYAMLTabs.length > 0 ? 80 : 50)
      }
      setState((prev) => ({ ...prev, showCondensed: width < 500 }))
      editorsRef.current.forEach((editor) => {
        editor.layout({ width, height })
      })
    }
  }

  const setEditorReadOnly = (readonly) => {
    const editor = editorsRef.current[0]
    if (editor) {
      editor.decorations = editor.deltaDecorations(editor.decorations, [])
      editor.revealLineInCenter(1)
    }
    setState((prev) => ({ ...prev, editorReadOnly: readonly }))
  }

  function renderSplitEditor(isLoaded) {
    const { showEditor } = state
    const editorClasses = classNames({
      'creation-view-split-container': true,
      showEditor,
    })
    let maxSize = '600px'
    const templateEditor = document.getElementsByClassName('template-editor')[0]
    if (templateEditor) {
      maxSize = `${(templateEditor.getBoundingClientRect().width * 8) / 10}px`
    }
    return (
      <div className={editorClasses}>
        <Drawer isExpanded={showEditor} isInline={true}>
          <DrawerContent
            style={{ overflow: 'hidden' }}
            panelContent={
              <DrawerPanelContent
                isResizable={true}
                defaultSize="600px"
                maxSize={maxSize}
                minSize="200px"
                colorVariant={DrawerColorVariant.secondary}
                id="editor-drawer-panel"
              >
                {showEditor && renderEditor()}
              </DrawerPanelContent>
            }
          >
            <DrawerContentBody style={{ height: '100%' }}>
              <PageSection hasBodyWrapper={false} isFilled type="wizard" style={{ height: '100%' }}>
                {renderControls(isLoaded)}
              </PageSection>
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </div>
    )
  }

  function renderControls(isLoaded) {
    const { controlData, showEditor, isCustomName, isEditing, notifications, i18n } = state
    const { controlData: originalControlData, fetchControl } = props
    const { fetchData } = fetchControl || {}
    return (
      <Form
        wizardClassName={props.wizardClassName}
        handleControlChange={handleControlChange}
        handleNewEditorMode={handleNewEditorMode}
        handleGroupChange={handleGroupChange}
        controlData={controlData || originalControlData}
        fetchData={fetchData}
        originalControlData={originalControlData}
        notifications={notifications}
        showEditor={showEditor}
        showPortals={props.portals ? null : Portals}
        wizardData={props.wizardData}
        handleCreateResource={handleCreateResource}
        handleCancelCreate={handleCancelCreate}
        isCustomName={isCustomName}
        isEditing={isEditing}
        isLoaded={isLoaded}
        creationStatus={props.createControl.creationStatus}
        i18n={i18n}
        onChange={props.onControlChange}
        templateYAML={state.templateYAML}
        setEditorReadOnly={setEditorReadOnly}
        controlProps={props.controlProps}
        resetStatus={state.resetStatus}
        backButtonOverride={props.createControl.backButtonOverride}
      />
    )
  }

  function forceGenerate() {
    const { template, otherYAMLTabs, editStack, controlData, showEditor, i18n } = state
    if (showEditor) {
      const {
        templateYAML: newYAML,
        templateObject,
        templateResources,
        decorationRows,
      } = generateSource(template, editStack, controlData, otherYAMLTabs)
      highlightDecorations(editorsRef.current, decorationRows, i18n)
      setState((prev) => ({
        ...prev,
        templateYAML: newYAML,
        templateObject,
        templateResources,
        decorationRows,
      }))
    }
  }

  function handleControlChange(control, controlData, creationView, isCustomName) {
    const { template, templateYAML, otherYAMLTabs, firstTemplateYAML, editStack, isFinalValidate, i18n } = state

    // if user typed on a tab, save it to be merged with control changes
    otherYAMLTabs.forEach((tab) => {
      if (tab.typingYAML) {
        tab.typedYAML = tab.typingYAML
        delete tab.typingYAML
      }
    })

    // custom action when control is selected
    const { onSelect } = control
    if (typeof onSelect === 'function') {
      onSelect(control)
    }

    const {
      templateYAML: newYAML,
      templateObject,
      templateResources,
      decorationRows,
    } = generateSource(template, editStack, controlData, otherYAMLTabs)
    validateControls(
      editorsRef.current,
      newYAML,
      otherYAMLTabs,
      undefined,
      props.onControlValidation,
      controlData,
      isFinalValidate,
      i18n
    )
    highlightAllChanges(editorsRef.current, templateYAML, newYAML, otherYAMLTabs, selectedTabRef.current)
    highlightDecorations(editorsRef.current, decorationRows, i18n)
    const notifications = controlData.filter((c) => {
      return !!c.exception && isFinalValidate
    })
    setState((prev) => ({
      ...prev,
      controlData,
      isCustomName,
      templateYAML: newYAML,
      templateObject,
      templateResources,
      exceptions: [],
      notifications,
      decorationRows,
    }))
    isDirtyRef.current = firstTemplateYAML !== newYAML
    handleScrollAndCollapse(control, controlData, creationView)
  }

  function handleGroupChange(control, controlData, creationView, inx) {
    const {
      showEditor,
      editor,
      template,
      templateYAML,
      otherYAMLTabs,
      firstTemplateYAML,
      editStack,
      isFinalValidate,
      i18n,
    } = state
    const { active, controlData: cd, onChange } = control
    const { onControlInitialize } = props
    if (inx === undefined) {
      // add new group
      const {
        prompts: { nameId, baseName },
      } = control
      const newGroup = initializeControls(cd, editor, onControlInitialize, i18n, control.nextUniqueGroupID, true)
      control.nextUniqueGroupID++
      active.push(newGroup)
      const nameControl = keyBy(newGroup, 'id')[nameId]
      if (nameControl) {
        nameControl.active = `${baseName}-${active.length - 1}`
      }
      if (onChange) {
        onChange(control, controlData)
      }

      // scroll down
      if (creationView) {
        setTimeout(() => {
          ;(showEditor ? creationView : window).scrollBy({
            top: 260,
            left: 0,
            behavior: 'smooth',
          })
        }, 100)
      }
    } else {
      active.splice(inx, 1)
    }
    const {
      templateYAML: newYAML,
      templateObject,
      templateResources,
      decorationRows,
    } = generateSource(template, editStack, controlData, otherYAMLTabs)
    validateControls(
      editorsRef.current,
      newYAML,
      otherYAMLTabs,
      undefined,
      props.onControlValidation,
      controlData,
      isFinalValidate,
      i18n
    )
    highlightAllChanges(editorsRef.current, templateYAML, newYAML, otherYAMLTabs, selectedTabRef.current)
    highlightDecorations(editorsRef.current, decorationRows, i18n)
    setState((prev) => ({
      ...prev,
      controlData,
      templateYAML: newYAML,
      templateObject,
      templateResources,
      decorationRows,
    }))
    isDirtyRef.current = firstTemplateYAML !== newYAML
  }

  function handleNewEditorMode(control, controlData, creationView, wizardRef) {
    let { notifications } = state
    const {
      controlData: newControlData,
      template,
      templateYAML,
      templateObject,
      templateResources,
      otherYAMLTabs,
    } = changeEditorMode(control, controlData)
    controlData = newControlData

    // custom action when control is selected
    const { onSelect } = control
    if (typeof onSelect === 'function') {
      onSelect(control)
    }

    delete control.exception
    if (notifications.length > 0) {
      notifications = controlData.filter((c) => {
        return !!c.exception
      })
    }
    state.resetStatus()
    setState((prev) => ({
      ...prev,
      controlData,
      template: template,
      templateYAML,
      templateObject,
      templateResources,
      notifications,
      exceptions: [],
      editorReadOnly: false,
      isFinalValidate: false,
      otherYAMLTabs,
    }))

    handleScrollAndCollapse(control, controlData, creationView, wizardRef)
  }

  // change editor mode based on what card is selected
  function changeEditorMode(control, controlData) {
    let { template } = props
    const { onControlInitialize } = props
    const { editStack, otherYAMLTabs, editor, i18n } = state
    let { templateYAML, templateObject, templateResources, decorationRows } = state
    let newYAML = templateYAML
    let newYAMLTabs = otherYAMLTabs

    // delete all controls below this card control
    const { availableMap, groupControlData } = control
    const parentControlData = groupControlData || controlData
    const insertInx = parentControlData.findIndex(({ id }) => id === control.id)
    const deleteLen = parentControlData.length - insertInx - 1
    if (deleteLen) {
      parentControlData.splice(insertInx + 1, deleteLen)
    }

    // add new controls and template
    const { change } = availableMap[control.active[0]] || {}
    if (change) {
      const { replaceTemplate = template, insertControlData } = change

      // insert control data into main control data
      if (insertControlData) {
        // splice control data with data from this card
        const cloned = cloneControlData(insertControlData)
        // give wizard chance to init
        cloned.forEach((ctrl) => onControlInitialize(ctrl))
        parentControlData.splice(insertInx + 1, 0, ...cloned)

        // if this card control is in a group, tell each control
        // what group control it belongs to
        if (groupControlData) {
          parentControlData.forEach((cd) => {
            cd.groupControlData = groupControlData
          })
        }
        controlData = initializeControls(controlData, editor, onControlInitialize, i18n)
      }

      // replace template and regenerate templateYAML and highlight diffs
      if (replaceTemplate) {
        template = replaceTemplate
        newYAMLTabs = newYAMLTabs || []
        ;({
          templateYAML: newYAML,
          templateObject,
          templateResources,
          decorationRows,
        } = generateSource(template, editStack, controlData, newYAMLTabs))
        if (newYAMLTabs.length === 0 && editorsRef.current.length > 1) {
          editorsRef.current.length = 1
        }
        highlightAllChanges(editorsRef.current, templateYAML, newYAML, otherYAMLTabs, selectedTabRef.current)
        highlightDecorations(editorsRef.current, decorationRows, i18n)
        templateYAML = newYAML
      }
    }
    return {
      controlData,
      template,
      templateYAML,
      templateObject,
      templateResources,
      otherYAMLTabs,
      decorationRows,
    }
  }

  function handleScrollAndCollapse(control, controlData, creationView, wizardRef) {
    if (wizardRef) {
      if (control.nextPageAfterSelection) {
        wizardRef.onNext()
      } else {
        const creationView = document.getElementsByClassName('creation-view-controls')[0]
        if (creationView && creationView.scrollBy) {
          setTimeout(() => {
            creationView.scrollBy({
              top: creationView.scrollHeight,
              left: 0,
              behavior: 'smooth',
            })
          }, 100)
        }
      }
    } else {
      const { showEditor, previouslySelectedCards } = state
      // user chose a card with new controls in it---scroll the view down to the new fields
      const {
        id,
        ref,
        uniqueGroupID = 0,
        scrollViewAfterSelection,
        collapseAboveAfterSelection,
        scrollViewToTopOnSelect,
      } = control
      if (scrollViewAfterSelection || collapseAboveAfterSelection || scrollViewToTopOnSelect) {
        const wasPreviouslySelected = previouslySelectedCards.includes(id + uniqueGroupID)
        if (!wasPreviouslySelected) {
          if (!creationView) {
            creationView = document.getElementsByClassName('content')[0]
          }
          if (creationView) {
            const scrollView = showEditor && creationView.scrollBy ? creationView : window
            const controlTop = ref.getBoundingClientRect().top
            const panelTop = showEditor ? creationView.getBoundingClientRect().top : 200
            setTimeout(() => {
              switch (true) {
                // collapse section above when this control is selected
                case collapseAboveAfterSelection === true:
                  controlData.some(({ id: tid, sectionRef, sectionTitleRef }) => {
                    if (sectionRef && sectionTitleRef) {
                      sectionRef.classList.toggle('collapsed', true)
                      sectionTitleRef.classList.toggle('collapsed', true)
                    }
                    return id === tid
                  })
                  setTimeout(() => {
                    scrollView.scrollTo({
                      top: 0,
                      left: 0,
                    })
                  }, 100)
                  break

                // scroll view down after control is selected by 'scrollViewAfterSelection' pixels
                case scrollViewAfterSelection !== undefined:
                  scrollView.scrollBy({
                    top: scrollViewAfterSelection,
                    left: 0,
                    behavior: 'smooth',
                  })
                  break

                // scroll control to top when cards have been collapsed (only one card shown)
                case scrollViewToTopOnSelect !== undefined:
                  scrollView.scrollBy({
                    top: controlTop - panelTop,
                    left: 0,
                    behavior: 'smooth',
                  })
                  break
              }
            }, 100)
            previouslySelectedCards.push(id + uniqueGroupID)
          }
        }
      }
      setState((prev) => ({ ...prev, previouslySelectedCards }))
    }
  }

  function renderEditor() {
    const { type = 'main', title = 'YAML' } = props
    const { editorReadOnly } = state
    const { hasUndo, hasRedo, exceptions, otherYAMLTabs, showSecrets, i18n } = state
    return (
      <div className="creation-view-yaml" ref={setYamlViewRef}>
        <EditorHeader
          otherYAMLTabs={otherYAMLTabs}
          handleTabChange={handleTabChange}
          handleShowSecretChange={handleShowSecrets}
          handleEditorCommand={handleEditorCommand}
          showSecrets={showSecrets}
          readOnly={editorReadOnly}
          title={title}
          type={type}
          i18n={i18n}
        >
          <EditorBar
            title={title}
            type={type}
            hasUndo={hasUndo}
            hasRedo={hasRedo}
            exceptions={exceptions}
            handleEditorCommand={handleEditorCommand}
            handleSearchChange={handleSearchChange}
            i18n={props.i18n}
          />
        </EditorHeader>
        {renderEditors()}
      </div>
    )
  }

  function renderEditors() {
    const { monacoEditor } = props
    const { activeYAMLEditor, otherYAMLTabs, editorReadOnly, templateYAML, decorationRows, showCondensed } = state
    return (
      <React.Fragment>
        <YamlEditor
          editor={monacoEditor}
          key="main"
          id="main"
          hide={activeYAMLEditor !== 0}
          width={'100%'}
          height={'100%'}
          wrapEnabled={true}
          addEditor={addEditor}
          showCondensed={showCondensed}
          onYamlChange={handleEditorChange}
          yaml={templateYAML}
          readOnly={editorReadOnly}
          decorationRows={decorationRows}
        />
        {otherYAMLTabs.map(({ id, templateYAML: yaml }, inx) => {
          return (
            <YamlEditor
              editor={monacoEditor}
              id={id}
              key={id}
              hide={activeYAMLEditor !== inx + 1}
              width={'100%'}
              height={'100%'}
              wrapEnabled={true}
              showCondensed={showCondensed}
              addEditor={addEditor}
              onYamlChange={handleEditorChange}
              yaml={yaml}
              readOnly={editorReadOnly}
            />
          )
        })}
      </React.Fragment>
    )
  }

  function handleTabChange(tabInx) {
    selectedTabRef.current = tabInx
    setState((prev) => ({ ...prev, activeYAMLEditor: tabInx }))
    layoutEditors()
  }

  function addEditor(id, editor) {
    editor.id = id
    const { otherYAMLTabs } = state
    let editorIndex = editorsRef.current.findIndex((e) => e.id === editor.id)
    if (editorIndex < 0) {
      editorIndex = editorsRef.current.push(editor) - 1
    } else {
      // update to latest object for this editor ID
      editorsRef.current[editorIndex] = editor
    }
    if (editorIndex >= 1) {
      set(otherYAMLTabs, `${editorIndex - 1}.editor`, editorsRef.current[editorIndex])
    } else {
      highlightDecorations(editorsRef.current, state.decorationRows, state.i18n)
    }
    layoutEditors()
    editor.clearedUndoRedoStack = false
    editor.onDidChangeModelContent(() => {
      const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
      const activeId = document.activeElement?.id
      const formHasFocus = !editorHasFocus && ['undo-button', 'redo-button'].indexOf(activeId) === -1
      const model = editor.getModel()
      if (!editor.clearedUndoRedoStack || formHasFocus) {
        model._undoRedoService._editStacks.clear()
        editor.clearedUndoRedoStack = true
      }
      const hasUndo = model.canUndo()
      const hasRedo = model.canRedo()
      setState((prev) => ({ ...prev, hasUndo, hasRedo }))
    })
  }

  // text editor commands
  function handleEditorCommand(command) {
    const { activeYAMLEditor } = state
    const editor = editorsRef.current[activeYAMLEditor]
    switch (command) {
      case 'next':
      case 'previous':
        if (selectionIndexRef.current !== -1) {
          if (selectionsRef.current && selectionsRef.current.length > 1) {
            switch (command) {
              case 'next':
                selectionIndexRef.current++
                if (selectionIndexRef.current >= selectionsRef.current.length) {
                  selectionIndexRef.current = 0
                }
                break
              case 'previous':
                selectionIndexRef.current--
                if (selectionIndexRef.current < 0) {
                  selectionIndexRef.current = selectionsRef.current.length - 1
                }
                break
            }
            editor.revealLineInCenter(selectionsRef.current[selectionIndexRef.current].selectionStartLineNumber, 0)
          }
        }
        break
      case 'copyAll':
        if (editor) {
          if (editor && editor.getModel()) {
            const model = editor.getModel()
            const selection = editor.getSelection()
            if (model && selection) {
              const selectedText = model.getValueInRange(selection)
              navigator.clipboard.writeText(selectedText || editor.getValue() || '')
            }
          }
        }
        break
      case 'undo':
        if (editor) {
          editor.trigger('api', 'undo')
        }
        break
      case 'redo':
        if (editor) {
          editor.trigger('api', 'redo')
        }
        break
      case 'restore':
        resetEditor()
        break
      case 'close':
        closeEdit()
        break
    }
    return command
  }

  function closeEdit() {
    localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
    setState((prev) => ({ ...prev, showEditor: false }))
  }

  function handleShowSecrets() {
    const { showSecrets, controlData } = state
    if (showSecrets) {
      localStorage.removeItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE)
    } else {
      localStorage.setItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE, 'true')
    }
    const showControl = controlData.find(({ id: idCtrl }) => idCtrl === 'showSecrets')
    if (showControl) {
      showControl.active = !showSecrets
      setState((prev) => ({ ...prev, showSecrets: !showSecrets }))
      handleControlChange(showControl, controlData)
    }
  }

  function handleSearchChange(searchName) {
    const { activeYAMLEditor } = state
    const editor = editorsRef.current[activeYAMLEditor]
    if (searchName.length > 1 || nameSearchModeRef.current) {
      if (searchName) {
        const found = editor.getModel().findMatches(searchName)
        if (found.length > 0) {
          selectionsRef.current = found.map(({ range }) => {
            const { endColumn, endLineNumber, startColumn, startLineNumber } = range
            return {
              positionColumn: endColumn,
              positionLineNumber: endLineNumber,
              selectionStartColumn: startColumn,
              selectionStartLineNumber: startLineNumber,
            }
          })
          editor.setSelections(selectionsRef.current)
          editor.revealLineInCenter(selectionsRef.current[0].selectionStartLineNumber, 0)
          selectionIndexRef.current = 1
        } else {
          selectionsRef.current = null
          selectionIndexRef.current = -1
        }
      } else {
        selectionsRef.current = null
        selectionIndexRef.current = -1
        editor.setSelections([
          {
            positionColumn: 0,
            positionLineNumber: 0,
            selectionStartColumn: 0,
            selectionStartLineNumber: 0,
          },
        ])
      }
      nameSearchRef.current = searchName
      nameSearchModeRef.current = searchName.length > 0
    }
  }

  function handleEditorChange(yaml) {
    parseDebounced(yaml)
  }

  function handleParse(yaml) {
    const {
      otherYAMLTabs,
      activeYAMLEditor,
      controlData,
      templateResources,
      firstTemplateYAML,
      isFinalValidate,
      i18n,
    } = state
    let tab
    let { editStack, templateYAML, notifications } = state

    if (activeYAMLEditor === 0) {
      templateYAML = yaml
    } else {
      tab = otherYAMLTabs[activeYAMLEditor - 1]
      // remember last form generated yaml so we can merge with it
      // any later form changes
      if (!tab.baseTemplateYAML) {
        tab.baseTemplateYAML = tab.templateYAML
      } else if (tab.mergedYAML) {
        tab.baseTemplateYAML = tab.mergedYAML
        delete tab.mergedYAML
        delete tab.typedYAML
      }
      tab.typingYAML = yaml
      // update the yaml shown in this tab
      tab.templateYAML = yaml
    }

    // update controls with values typed into yaml
    const { parsedResources, templateExceptionMap, hasSyntaxExceptions } = validateControls(
      editorsRef.current,
      templateYAML,
      otherYAMLTabs,
      tab ? tab.id : undefined,
      props.onControlValidation,
      controlData,
      isFinalValidate,
      i18n
    )
    if (notifications.length > 0) {
      notifications = []
      if (hasSyntaxExceptions) {
        Object.values(templateExceptionMap).forEach(({ exceptions }) => {
          exceptions.forEach(({ row, text, editor, tabInx }) => {
            notifications.push({
              id: 'error',
              variant: 'danger',
              exception: i18n('error.create.syntax', [text]),
              text,
              row,
              editor,
              tabInx,
            })
          })
        })
      } else {
        notifications = controlData.filter((control) => {
          return !!control.exception
        })
      }
    }

    isDirtyRef.current = firstTemplateYAML !== yaml

    // update edit stack so that when the user changes something in the form
    // it doesn't wipe out what they just typed
    editStack = updateEditStack(editStack, templateResources, parsedResources)

    let newState
    if (activeYAMLEditor !== 0) {
      const { template, templateYAML: oldYAML } = state
      const {
        templateYAML: newYAML,
        templateObject,
        templateResources: tr,
      } = generateSource(template, editStack, controlData, otherYAMLTabs)
      highlightChanges(editorsRef.current[0], oldYAML, newYAML, true)
      newState = {
        controlData,
        notifications,
        templateYAML: newYAML,
        templateObject,
        templateResources: tr,
        editStack,
      }
    } else {
      newState = { controlData, notifications, templateYAML, editStack }
    }

    // what lines should be readonly in editor
    newState.decorationRows = []
    const decorationData = getDecorationData(controlData)
    if (decorationData.length) {
      const parsed = parseYAML(newState.templateYAML)
      newState.decorationRows = getDecorationRows(decorationData, parsed.parsed)
      highlightDecorations(editorsRef.current, newState.decorationRows, i18n)
    }

    setState((prev) => ({ ...prev, ...newState }))

    return templateYAML // for jest test
  }

  function getResourceJSON() {
    const { templateYAML, controlData, otherYAMLTabs, editStack, i18n } = state
    let canCreate = false
    const { templateObjectMap, templateExceptionMap, hasSyntaxExceptions, hasValidationExceptions } = validateControls(
      editorsRef.current,
      templateYAML,
      otherYAMLTabs,
      undefined,
      props.onControlValidation,
      controlData,
      true,
      i18n
    )
    let notifications = []
    if (hasSyntaxExceptions || hasValidationExceptions) {
      logSourceErrors(props.logging, templateYAML, controlData, otherYAMLTabs, templateExceptionMap)
      Object.values(templateExceptionMap).forEach(({ exceptions }) => {
        exceptions.forEach(({ row, text, editor, tabInx, controlId, ref }) => {
          notifications.push({
            id: 'error',
            variant: 'danger',
            exception: i18n('error.create.syntax', [text]),
            text,
            row,
            editor,
            tabInx,
            controlId,
            ref,
          })
        })
      })
    } else {
      notifications = controlData.filter((control) => {
        return !!control.exception
      })
    }
    canCreate = notifications.length === 0

    setState((prev) => ({
      ...prev,
      notifications,
      hasFormExceptions: !canCreate,
      isFinalValidate: true,
    }))
    lostChangesContext.submitForm()
    scrollControlPaneToNotifications()

    if (canCreate) {
      // cache user data
      cacheUserData(controlData)

      // create payload
      const payload = []
      Object.entries(templateObjectMap['<<main>>']).forEach(([, values]) => {
        values.forEach(({ $raw }) => {
          if ($raw) {
            payload.push($raw)
          }
        })
      })
      replaceSecrets(payload)

      return {
        createResources: payload,
        deleteResources: editStack ? [...editStack.deletedLinks] : undefined,
      }
    }
    return null
  }

  function replaceSecrets(payload) {
    const { templateObject } = state
    if (templateObject.Secret) {
      const secretsMap = keyBy(
        templateObject.Secret.filter(({ $raw: { metadata } }) => metadata),
        ({ $raw }) => {
          const {
            metadata: { name, namespace },
          } = $raw
          return `${namespace}/${name}`
        }
      )
      payload
        .filter(({ metadata }) => metadata)
        .forEach((resource) => {
          const {
            kind,
            metadata: { name, namespace },
            data,
          } = resource
          if (kind === 'Secret' && !data?.['install-config.yaml']) {
            const secret = secretsMap[`${namespace}/${name}`]
            if (secret) {
              merge(resource, secret.$raw)
            }
          }
        })
    }
  }

  function scrollControlPaneToNotifications() {
    setTimeout(() => {
      if (containerRef.current) {
        const notifications = document.getElementsByClassName('creation-view-controls-notifications-footer')[0]
        if (notifications && notifications.scrollIntoView) {
          notifications.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }
    }, 0)
  }

  function renderEditButton(isLoaded) {
    const { monacoEditor, portals, i18n } = props
    const { editorReadOnly } = state
    const { editBtn } = portals || Portals
    if (monacoEditor && editBtn && isLoaded) {
      const portal = document.getElementById(editBtn)
      if (portal) {
        const { showSecrets, controlData } = state
        let { showEditor } = state
        const handleToggle = () => {
          if (showEditor) {
            localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
          } else {
            localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
          }
          showEditor = !showEditor
          setState((prev) => ({ ...prev, showEditor }))

          // if was closed before and now open
          // secrets may be shown, so hide if necessary
          if (showEditor && !showSecrets) {
            const showControl = controlData.find(({ id: idCtrl }) => idCtrl === 'showSecrets')
            if (showControl) {
              showControl.active = false
              handleControlChange(showControl, controlData)
            }
          }
        }
        renderedPortalsRef.current = true
        let switchLabel = ''
        if (showEditor) {
          switchLabel = i18n ? i18n('edit.yaml.on') : 'Show Yaml'
        } else {
          switchLabel = i18n ? i18n('edit.yaml.off') : 'Hide Yaml'
        }
        if (editorReadOnly) {
          switchLabel = i18n ? i18n('edit.yaml.on.ro') : 'YAML (read only): On'
        }

        return ReactDOM.createPortal(
          <div className="edit-template-switch">
            <Switch
              id="edit-yaml"
              key={`is${showEditor}`}
              isChecked={showEditor}
              label={switchLabel}
              onChange={handleToggle}
            />
          </div>,
          portal
        )
      }
    }
    return null
  }

  function renderCreateButton(isLoaded) {
    const { showWizard, isEditing, controlData, showEditor } = state
    const { portals, createControl = {}, i18n } = props
    const { createBtn } = portals || Portals
    if (createBtn && !showWizard && isLoaded) {
      const { hasPermissions = true } = createControl
      const titleText = !hasPermissions ? (i18n ? i18n('button.save.access.denied') : 'Denied') : undefined
      const disableButton = !hasPermissions
      const portal = document.getElementById(createBtn)
      const label = isEditing ? (i18n ? i18n('button.update') : 'Update') : i18n ? i18n('button.create') : 'Create'

      const onClick = () => {
        setState((state) => ({
          ...state,
          notifications: [],
        }))

        const validations = controlData.map((cd) => cd.validate).filter(Boolean)
        if (validations.length) {
          Promise.all(validations.map((v) => v())).then((results) => {
            const hasErrors = results.some((result) => !isEmpty(result))
            if (hasErrors) {
              setState((state) => ({
                ...state,
                notifications: [{ exception: 'Please fix the form errors' }],
              }))
              bump()

              setTimeout(() => {
                const viewClassname = showEditor ? 'creation-view-controls' : 'SplitPane  vertical '
                document.getElementsByClassName(viewClassname)[0]?.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth',
                })
              }, 100)
              return
            } else {
              handleCreateResource()
            }
          })
        } else {
          handleCreateResource()
        }
      }
      const button = (
        <Button
          id={`${createBtn}-btn`}
          onClick={onClick}
          variant={'primary'}
          isDisabled={disableButton}
          data-testid={createBtn}
        >
          {label}
        </Button>
      )
      if (portal) {
        return !hasPermissions
          ? ReactDOM.createPortal(
              <div title={titleText} isDisabled={!hasPermissions}>
                {button}
              </div>,
              portal
            )
          : ReactDOM.createPortal(button, portal)
      }
    }
    return null
  }

  function handleCreateResource(noRedirect) {
    const { createControl } = props
    const { createResource } = createControl
    const resourceJSON = getResourceJSON()
    if (resourceJSON) {
      setState((prev) => ({ ...prev, resourceJSON }))
      createResource(resourceJSON, noRedirect)
      return resourceJSON
    }
  }

  function renderCancelButton() {
    const { showWizard } = state
    const { portals, i18n } = props
    const { cancelBtn } = portals || Portals
    if (cancelBtn && !showWizard) {
      const portal = document.getElementById(cancelBtn)
      if (portal) {
        return ReactDOM.createPortal(
          <Button id={cancelBtn} onClick={handleCancelCreate} variant={'secondary'}>
            {i18n ? i18n('button.cancel') : 'Cancel'}
          </Button>,
          portal
        )
      }
    }
    return null
  }

  function handleCancelCreate() {
    const { createControl } = props
    const { cancelCreate } = createControl
    lostChangesContext.cancelForm()
    cancelCreate()
  }

  function resetEditor() {
    const { controlData: initialControlData, onControlInitialize } = props
    const { template, editStack = {}, resetInx, editor, i18n } = state
    const cd = cloneControlData(initialControlData)
    const controlData = initializeControls(cd, editor, onControlInitialize, i18n)
    const otherYAMLTabs = []
    if (editStack.initialized) {
      delete editStack.initialized
    }
    const { templateYAML, templateObject, templateResources, decorationRows } = generateSource(
      template,
      editStack,
      controlData,
      otherYAMLTabs
    )
    setState((prev) => ({
      ...prev,
      isCustomName: false,
      template,
      controlData,
      activeYAMLEditor: 0,
      exceptions: [],
      previouslySelectedCards: [],
      notifications: [],
      otherYAMLTabs,
      hasUndo: false,
      hasRedo: false,
      isFinalValidate: false,
      templateYAML,
      templateObject,
      templateResources,
      editStack,
      resetInx: resetInx + 1,
      decorationRows,
    }))
    isDirtyRef.current = false
    selectedTabRef.current = 0
    firstGoToLinePerformedRef.current = false
    editorsRef.current = []
  }

  handleParseRef.current = handleParse
  forceGenerateRef.current = forceGenerate

  useImperativeHandle(ref, () => ({
    getResourceJSON,
  }))

  const { isLoaded, showEditor, showWizard, resetInx } = state
  if (!showEditor) {
    editorsRef.current = []
  }
  const viewClasses = classNames({
    'template-editor': true,
    showEditor,
    showWizard,
  })

  return (
    <div key={`key${resetInx}`} className={viewClasses} ref={setContainerRef}>
      <LostChangesPrompt dirty={isDirtyRef.current} />
      {renderSplitEditor(isLoaded)}
      {renderEditButton(isLoaded)}
      {renderCreateButton(isLoaded)}
      {renderCancelButton()}
    </div>
  )
})

export default TemplateEditor
