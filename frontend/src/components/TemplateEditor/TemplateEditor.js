'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import { Prompt } from 'react-router-dom'
import SplitPane from 'react-split-pane'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import isEmpty from 'lodash/isEmpty'
import { Button, Switch, Alert } from '@patternfly/react-core'
import {
  initializeControls,
  parseYAML,
  getImmutables,
  getImmutableRows,
  generateSource,
  getUniqueName,
  cacheUserData,
} from './utils/source-utils'
import { logCreateErrors, logSourceErrors } from './utils/logger'
import { validateControls } from './utils/validate-controls'
import { updateEditStack } from './utils/refresh-source-from-stack'
import { highlightChanges, highlightAllChanges, highlightImmutables } from './utils/refresh-source-highlighting'
import ControlPanel from './controls/ControlPanel'
import EditorHeader from './components/EditorHeader'
import YamlEditor from './components/YamlEditor'
import EditorBar from './components/EditorBar'
import './css/template-editor.css'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'

const TEMPLATE_EDITOR_OPEN_COOKIE = 'yaml'
const TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE = 'template-editor-show-secrets-cookie'

const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id',
})

export default class TemplateEditor extends React.Component {
  static propTypes = {
    controlData: PropTypes.array.isRequired,
    controlProps: PropTypes.object,
    createControl: PropTypes.shape({
      hasPermissions: PropTypes.bool,
      createResource: PropTypes.func,
      pauseCreate: PropTypes.func,
      cancelCreate: PropTypes.func,
      creationStatus: PropTypes.string,
      creationMsg: PropTypes.array,
      resetStatus: PropTypes.func,
    }).isRequired,
    editorReadOnly: PropTypes.bool,
    fetchControl: PropTypes.shape({
      resources: PropTypes.array,
      isLoaded: PropTypes.bool,
      isFailed: PropTypes.bool,
      fetchData: PropTypes.object,
    }),
    i18n: PropTypes.func,
    initialOpen: PropTypes.bool,
    logging: PropTypes.bool,
    monacoEditor: PropTypes.element,
    onControlChange: PropTypes.func,
    onControlInitialize: PropTypes.func,
    onControlValidation: PropTypes.func,
    onStepChange: PropTypes.func,
    portals: PropTypes.object,
    template: PropTypes.func.isRequired,
    theme: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    wizardClassName: PropTypes.string,
  }

  static getDerivedStateFromProps(props, state) {
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
                  : i18n(isEditing ? 'success.create.updating' : 'success.create.creating', [type]),
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
                  : i18n(isEditing ? 'success.create.updated' : 'success.create.created', [type]),
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
    const showEditor = (monacoEditor || initialOpen) && isLoaded && !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE)
    let newState = { isLoaded, isFailed, showEditor }

    // has control data been initialized?
    const { controlData: initialControlData, onControlInitialize } = props
    let { controlData, templateYAML, templateObject, templateResources, immutableRows, editStack } = state
    const { editor, template, showSecrets } = state
    if (!controlData) {
      // initialize control data
      const cd = cloneDeep(initialControlData)
      controlData = initializeControls(cd, editor, onControlInitialize, i18n)
      newState = { ...newState, controlData }

      const showControl = controlData.find(({ id: idCtrl }) => idCtrl === 'showSecrets')
      if (showControl) {
        showControl.active = showSecrets || !showEditor
      }
    }

    // has source been initialized?
    if (isLoaded && !templateYAML) {
      // editing an existing set of resources??
      const customResources = get(fetchControl, 'resources')
      if (customResources) {
        editStack = { customResources, editor, i18n }
      }

      // generate source from template or stack of resources
      ;({ templateYAML, templateObject, templateResources, immutableRows } = generateSource(
        template,
        editStack,
        controlData
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
        immutableRows,
      }
    }

    // make sure an auto generated name is unique
    const { isCustomName } = state
    if (!isCustomName) {
      const name = controlData.find(({ id }) => id === 'name')
      if (name) {
        const { active, existing } = name
        const uniqueName = getUniqueName(active, new Set(existing))
        if (uniqueName !== active) {
          name.active = uniqueName
          ;({ templateYAML, templateObject, templateResources, immutableRows } = generateSource(
            template,
            editStack,
            controlData
          ))
          newState = {
            ...newState,
            controlData,
            templateYAML,
            templateObject,
            templateResources,
            immutableRows,
          }
        }
      }
    }

    return newState
  }

  constructor(props) {
    super(props)
    this.state = {
      isCustomName: false,
      showEditor: !!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE),
      showSecrets: !!localStorage.getItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE),
      template: props.template,
      i18n: props.i18n || ((msg) => msg),
      activeYAMLEditor: 0,
      exceptions: [],
      previouslySelectedCards: [],
      notifications: [],
      otherYAMLTabs: [],
      /* eslint-disable-next-line react/no-unused-state */
      hasFormExceptions: false,
      isFinalValidate: false,
      hasUndo: false,
      hasRedo: false,
      resetInx: 0,
      hasPauseCreate: !!get(props, 'createControl.pauseCreate'),
      editor: {
        forceUpdate: (() => {
          this.forceUpdate()
        }).bind(this),
        currentData: (() => {
          return this.state.controlData
        }).bind(this),
      },
    }

    const hasStep = props.controlData.find(({ type }) => type === 'step')
    this.state.showWizard = !!hasStep

    this.selectedTab = 0
    this.isDirty = false
    this.firstGoToLinePerformed = false
    this.editors = []
    this.parseDebounced = debounce((yaml) => {
      this.handleParse(yaml)
    }, 500)
    this.handleEditorCommand = this.handleEditorCommand.bind(this)
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.gotoEditorLine = this.gotoEditorLine.bind(this)
    this.handleNewEditorMode = this.handleNewEditorMode.bind(this)
    this.handleControlChange = this.handleControlChange.bind(this)
    this.handleGroupChange = this.handleGroupChange.bind(this)
    if (props.initialOpen) {
      localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
    }
    const { type = 'main' } = this.props
    this.splitterSizeCookie = `TEMPLATE-EDITOR-SPLITTER-SIZE-${type.toUpperCase()}`
    if (!this.state.hasPauseCreate) {
      this.beforeUnloadFunc = ((event) => {
        if (this.isDirty) {
          event.preventDefault()
          event.returnValue = this.isDirty
        }
      }).bind(this)
      window.addEventListener('beforeunload', this.beforeUnloadFunc)
    }
  }

  componentDidMount() {
    if (!this.renderedPortals) {
      setTimeout(() => {
        this.forceUpdate()
      }, 0)
    }
    if (window.ResizeObserver) {
      const temptifly = document.getElementsByClassName('temptifly')[0]
      const resizeObserver = new ResizeObserver(
        (() => {
          this.layoutEditors()
        }).bind(this)
      )
      resizeObserver.observe(temptifly)
    }
    this.innerWidth = window.innerWidth
    window.addEventListener(
      'resize',
      (() => {
        if (this.innerWidth !== window.innerWidth) {
          this.innerWidth = window.innerWidth
          localStorage.removeItem(this.splitterSizeCookie)
          const pane1 = document.getElementsByClassName('Pane1')
          if (pane1 && pane1[0]) {
            pane1[0].style.width = `${this.innerWidth / 2}px`
          }
        }
        this.layoutEditors()
      }).bind(this)
    )
  }

  componentWillUnmount() {
    const { createControl = {} } = this.props
    if (createControl.pauseCreate) {
      const { controlData } = this.state
      createControl.pauseCreate(controlData)
    }
    window.removeEventListener('beforeunload', this.beforeUnloadFunc)
  }

  setSplitPaneRef = (splitPane) => (this.splitPane = splitPane)

  handleSplitterDefault = () => {
    const width = window.innerWidth
    const cookie = localStorage.getItem(this.splitterSizeCookie)
    let size = cookie ? parseInt(cookie, 10) : width
    if (!cookie) {
      size = width / 2
      localStorage.setItem(this.splitterSizeCookie, size)
    } else if (size > (width * 7) / 10) {
      size = (width * 7) / 10
    }
    return size
  }

  handleSplitterChange = (size) => {
    localStorage.setItem(this.splitterSizeCookie, size)
    this.layoutEditors()
  }

  setContainerRef = (container) => {
    this.containerRef = container
    this.layoutEditors()
  }

  setEditorReadOnly = (readonly) => {
    const editor = this.editors[0]
    if (editor) {
      editor.decorations = editor.deltaDecorations(editor.decorations, [])
      editor.revealLineInCenter(1)
    }
    this.setState({ editorReadOnly: readonly })
  }

  render() {
    const { isLoaded, isFailed, showEditor, showWizard, resetInx, hasPauseCreate, i18n } = this.state
    if (!showEditor) {
      this.editors = []
    }

    if (isLoaded && isFailed) {
      return <Alert variant={'danger'} title={i18n('overview.error.default')} />
    }
    const viewClasses = classNames({
      temptifly: true,
      showEditor,
      showWizard,
    })
    return (
      <div key={`key${resetInx}`} className={viewClasses} ref={this.setContainerRef}>
        {!hasPauseCreate && <Prompt when={this.isDirty} message={i18n('changes.maybe.lost')} />}
        {this.renderSplitEditor(isLoaded)}
        {this.renderEditButton(isLoaded)}
        {this.renderCreateButton(isLoaded)}
        {this.renderCancelButton()}
      </div>
    )
  }

  renderSplitEditor(isLoaded) {
    const { showEditor } = this.state
    const editorClasses = classNames({
      'creation-view-split-container': true,
      showEditor,
    })
    let maxSize
    const page = document.getElementById('page')
    if (page) {
      maxSize = (page.getBoundingClientRect().width * 8) / 10
    }
    return (
      <div className={editorClasses}>
        <SplitPane
          split="vertical"
          minSize={500}
          maxSize={maxSize}
          ref={this.setSplitPaneRef}
          defaultSize={this.handleSplitterDefault()}
          onChange={this.handleSplitterChange}
          pane1Style={showEditor ? undefined : { width: '100%' }}
          style={{ overflow: showEditor ? 'auto hidden' : 'hidden auto' }}
        >
          {this.renderControls(isLoaded)}
          {showEditor && this.renderEditor()}
        </SplitPane>
      </div>
    )
  }

  renderControls(isLoaded) {
    const { controlData, showEditor, isCustomName, isEditing, notifications, i18n } = this.state
    const { controlData: originalControlData, fetchControl } = this.props
    const { fetchData } = fetchControl || {}
    return (
      <ControlPanel
        wizardClassName={this.props.wizardClassName}
        handleControlChange={this.handleControlChange}
        handleNewEditorMode={this.handleNewEditorMode}
        handleGroupChange={this.handleGroupChange}
        controlData={controlData || originalControlData}
        fetchData={fetchData}
        originalControlData={originalControlData}
        notifications={notifications}
        showEditor={showEditor}
        showPortals={this.props.portals ? null : Portals}
        wizardData={this.wizardData}
        handleCreateResource={this.handleCreateResource.bind(this)}
        handleCancelCreate={this.handleCancelCreate.bind(this)}
        isCustomName={isCustomName}
        isEditing={isEditing}
        isLoaded={isLoaded}
        creationStatus={this.props.createControl.creationStatus}
        i18n={i18n}
        onChange={this.props.onControlChange}
        onStepChange={this.props.onStepChange}
        templateYAML={this.state.templateYAML}
        setEditorReadOnly={this.setEditorReadOnly.bind(this)}
        controlProps={this.props.controlProps}
        resetStatus={this.state.resetStatus}
      />
    )
  }

  handleControlChange(control, controlData, creationView, isCustomName) {
    const { template, templateYAML, otherYAMLTabs, firstTemplateYAML, editStack, isFinalValidate, i18n } = this.state

    // if custom editing on a tab, clear it now that user is using controls
    otherYAMLTabs.forEach((tab) => {
      delete tab.control.customYAML
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
      immutableRows,
    } = generateSource(template, editStack, controlData, otherYAMLTabs)
    validateControls(
      this.editors,
      newYAML,
      otherYAMLTabs,
      undefined,
      this.props.onControlValidation,
      controlData,
      isFinalValidate,
      i18n
    )
    highlightAllChanges(this.editors, templateYAML, newYAML, otherYAMLTabs, this.selectedTab)
    highlightImmutables(this.editors, immutableRows)
    const notifications = controlData.filter((c) => {
      return !!c.exception && isFinalValidate
    })
    this.setState({
      controlData,
      isCustomName,
      templateYAML: newYAML,
      templateObject,
      templateResources,
      exceptions: [],
      notifications,
      immutableRows,
    })
    this.isDirty = firstTemplateYAML !== newYAML
    this.handleScrollAndCollapse(control, controlData, creationView)
  }

  handleGroupChange(control, controlData, creationView, inx) {
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
    } = this.state
    const { active, controlData: cd, onChange } = control
    const { onControlInitialize } = this.props
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
      immutableRows,
    } = generateSource(template, editStack, controlData, otherYAMLTabs)
    validateControls(
      this.editors,
      newYAML,
      otherYAMLTabs,
      undefined,
      this.props.onControlValidation,
      controlData,
      isFinalValidate,
      i18n
    )
    highlightAllChanges(this.editors, templateYAML, newYAML, otherYAMLTabs, this.selectedTab)
    highlightImmutables(this.editors, immutableRows)
    this.setState({
      controlData,
      templateYAML: newYAML,
      templateObject,
      templateResources,
      immutableRows,
    })
    this.isDirty = firstTemplateYAML !== newYAML
  }

  handleNewEditorMode(control, controlData, creationView, wizardRef) {
    let { notifications } = this.state
    const {
      controlData: newControlData,
      template,
      templateYAML,
      templateObject,
      templateResources,
      otherYAMLTabs,
    } = this.changeEditorMode(control, controlData)
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
    this.state.resetStatus()
    this.setState({
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
    })

    this.handleScrollAndCollapse(control, controlData, creationView, wizardRef)
  }

  // change editor mode based on what card is selected
  changeEditorMode(control, controlData) {
    let { template } = this.props
    const { onControlInitialize } = this.props
    const { editStack, otherYAMLTabs, editor, i18n } = this.state
    let { templateYAML, templateObject, templateResources, immutableRows } = this.state
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
        parentControlData.splice(insertInx + 1, 0, ...cloneDeep(insertControlData))

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
          immutableRows,
        } = generateSource(template, editStack, controlData, newYAMLTabs))
        if (newYAMLTabs.length === 0 && this.editors.length > 1) {
          this.editors.length = 1
        }
        highlightAllChanges(this.editors, templateYAML, newYAML, otherYAMLTabs, this.selectedTab)
        highlightImmutables(this.editors, immutableRows)
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
      immutableRows,
    }
  }

  handleScrollAndCollapse(control, controlData, creationView, wizardRef) {
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
      const { showEditor, previouslySelectedCards } = this.state
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
      this.setState({ previouslySelectedCards })
    }
  }

  renderEditor() {
    const { type = 'main', title = 'YAML' } = this.props
    const { editorReadOnly } = this.state
    const { hasUndo, hasRedo, exceptions, otherYAMLTabs, showSecrets, i18n } = this.state
    return (
      <div className="creation-view-yaml">
        <EditorHeader
          otherYAMLTabs={otherYAMLTabs}
          handleTabChange={this.handleTabChange}
          handleShowSecretChange={this.handleShowSecrets.bind(this)}
          handleEditorCommand={this.handleEditorCommand}
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
            gotoEditorLine={this.gotoEditorLine}
            handleEditorCommand={this.handleEditorCommand}
            handleSearchChange={this.handleSearchChange}
            i18n={this.props.i18n}
          />
        </EditorHeader>
        {this.renderEditors()}
      </div>
    )
  }

  renderEditors = () => {
    const { monacoEditor, theme } = this.props
    const { activeYAMLEditor, otherYAMLTabs, editorReadOnly, templateYAML, immutableRows } = this.state
    return (
      <React.Fragment>
        <YamlEditor
          editor={monacoEditor}
          key={'main'}
          hide={activeYAMLEditor !== 0}
          width={'100%'}
          height={'100%'}
          wrapEnabled={true}
          setEditor={this.addEditor}
          onYamlChange={this.handleEditorChange}
          theme={theme}
          yaml={templateYAML}
          readOnly={editorReadOnly}
          immutableRows={immutableRows}
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
              setEditor={this.addEditor}
              theme={theme}
              onYamlChange={this.handleEditorChange}
              yaml={yaml}
              readOnly={editorReadOnly}
            />
          )
        })}
      </React.Fragment>
    )
  }

  handleTabChange = (tabInx) => {
    this.selectedTab = tabInx
    this.setState({ activeYAMLEditor: tabInx })
    this.layoutEditors()
  }

  addEditor = (editor) => {
    const { otherYAMLTabs } = this.state
    this.editors.push(editor)
    if (this.editors.length > 1) {
      otherYAMLTabs[this.editors.length - 2].editor = editor
    } else {
      highlightImmutables(this.editors, this.state.immutableRows)
    }
    this.layoutEditors()

    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      const hasUndo = model.canUndo()
      const hasRedo = model.canRedo()
      this.setState({ hasUndo, hasRedo })
    })
  }

  layoutEditors() {
    if (this.containerRef && this.editors.length > 0) {
      const { otherYAMLTabs } = this.state
      const hasTabs = otherYAMLTabs.length >= 0
      const controlsSize = this.handleSplitterDefault()
      const rect = this.containerRef.getBoundingClientRect()
      const width = rect.width - controlsSize - 11
      const height = rect.height - (hasTabs ? 80 : 40)
      this.editors.forEach((editor) => {
        editor.layout({ width, height })
      })
    }
  }

  gotoEditorLine(line) {
    const { activeYAMLEditor } = this.state
    const editor = this.editors[activeYAMLEditor]
    editor.revealLineInCenter(line)
  }

  // text editor commands
  handleEditorCommand(command) {
    const { activeYAMLEditor } = this.state
    const editor = this.editors[activeYAMLEditor]
    switch (command) {
      case 'next':
      case 'previous':
        if (this.selectionIndex !== -1) {
          if (this.selections && this.selections.length > 1) {
            switch (command) {
              case 'next':
                this.selectionIndex++
                if (this.selectionIndex >= this.selections.length) {
                  this.selectionIndex = 0
                }
                break
              case 'previous':
                this.selectionIndex--
                if (this.selectionIndex < 0) {
                  this.selectionIndex = this.selections.length - 1
                }
                break
            }
            editor.revealLineInCenter(this.selections[this.selectionIndex].selectionStartLineNumber, 0)
          }
        }
        break
      case 'copyAll':
        if (editor) {
          const save = editor.getSelection()
          const range = editor.getModel().getFullModelRange()
          editor.setSelection(range)
          editor.focus()
          document.execCommand('copy')
          editor.setSelection(save)
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
        this.resetEditor()
        break
      case 'close':
        this.closeEdit()
        break
    }
    return command
  }

  closeEdit() {
    localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
    this.setState({ showEditor: false })
  }

  handleShowSecrets() {
    const { showSecrets, controlData } = this.state
    if (showSecrets) {
      localStorage.removeItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE)
    } else {
      localStorage.setItem(TEMPLATE_EDITOR_SHOW_SECRETS_COOKIE, 'true')
    }
    const showControl = controlData.find(({ id: idCtrl }) => idCtrl === 'showSecrets')
    if (showControl) {
      showControl.active = !showSecrets
      this.setState({ showSecrets: !showSecrets })
      this.handleControlChange(showControl, controlData)
    }
  }

  handleSearchChange(searchName) {
    const { activeYAMLEditor } = this.state
    const editor = this.editors[activeYAMLEditor]
    if (searchName.length > 1 || this.nameSearchMode) {
      if (searchName) {
        const found = editor.getModel().findMatches(searchName)
        if (found.length > 0) {
          this.selections = found.map(({ range }) => {
            const { endColumn, endLineNumber, startColumn, startLineNumber } = range
            return {
              positionColumn: endColumn,
              positionLineNumber: endLineNumber,
              selectionStartColumn: startColumn,
              selectionStartLineNumber: startLineNumber,
            }
          })
          editor.setSelections(this.selections)
          editor.revealLineInCenter(this.selections[0].selectionStartLineNumber, 0)
          this.selectionIndex = 1
        } else {
          this.selections = null
          this.selectionIndex = -1
        }
      } else {
        this.selections = null
        this.selectionIndex = -1
        editor.setSelections([
          {
            positionColumn: 0,
            positionLineNumber: 0,
            selectionStartColumn: 0,
            selectionStartLineNumber: 0,
          },
        ])
      }
      this.nameSearch = searchName
      this.nameSearchMode = searchName.length > 0
    }
  }

  handleEditorChange = (yaml) => {
    this.parseDebounced(yaml)
  }

  handleParse = (yaml) => {
    const {
      otherYAMLTabs,
      activeYAMLEditor,
      controlData,
      templateResources,
      firstTemplateYAML,
      isFinalValidate,
      i18n,
    } = this.state
    let tab
    let { editStack, templateYAML, notifications } = this.state

    if (activeYAMLEditor === 0) {
      templateYAML = yaml
    } else {
      tab = otherYAMLTabs[activeYAMLEditor - 1]
      // protect user edits from being clobbered by form updates
      tab.control.customYAML = yaml
      // update the yaml shown in this tab
      tab.templateYAML = yaml
    }

    // update controls with values typed into yaml
    const { parsedResources, templateExceptionMap, hasSyntaxExceptions } = validateControls(
      this.editors,
      templateYAML,
      otherYAMLTabs,
      tab ? tab.id : undefined,
      this.props.onControlValidation,
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

    this.isDirty = firstTemplateYAML !== yaml

    // update edit stack so that when the user changes something in the form
    // it doesn't wipe out what they just typed
    editStack = updateEditStack(editStack, templateResources, parsedResources)

    let newState
    if (activeYAMLEditor !== 0) {
      const { template, templateYAML: oldYAML } = this.state
      const {
        templateYAML: newYAML,
        templateObject,
        templateResources: tr,
      } = generateSource(template, editStack, controlData, otherYAMLTabs)
      highlightChanges(this.editors[0], oldYAML, newYAML, true)
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
    newState.immutableRows = []
    const immutables = getImmutables(controlData)
    if (immutables.length) {
      const parsed = parseYAML(newState.templateYAML)
      newState.immutableRows = getImmutableRows(immutables, parsed.parsed)
      highlightImmutables(this.editors, newState.immutableRows)
    }

    this.setState(newState)

    return templateYAML // for jest test
  }

  getResourceJSON = () => {
    const { templateYAML, controlData, otherYAMLTabs, editStack, i18n } = this.state
    let canCreate = false
    const { templateObjectMap, templateExceptionMap, hasSyntaxExceptions, hasValidationExceptions } = validateControls(
      this.editors,
      templateYAML,
      otherYAMLTabs,
      undefined,
      this.props.onControlValidation,
      controlData,
      true,
      i18n
    )
    let notifications = []
    if (hasSyntaxExceptions || hasValidationExceptions) {
      logSourceErrors(this.props.logging, templateYAML, controlData, otherYAMLTabs, templateExceptionMap)
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

    this.setState({
      notifications,
      /* eslint-disable-next-line react/no-unused-state */
      hasFormExceptions: !canCreate,
      isFinalValidate: true,
    })
    this.isDirty = false
    this.scrollControlPaneToNotifications()

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
      this.replaceSecrets(payload)

      return {
        createResources: payload,
        deleteResources: editStack ? [...editStack.deletedLinks] : undefined,
      }
    }
    return null
  }

  replaceSecrets = (payload) => {
    const { templateObject } = this.state
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
          } = resource
          if (kind === 'Secret') {
            const secret = secretsMap[`${namespace}/${name}`]
            if (secret) {
              merge(resource, secret.$raw)
            }
          }
        })
    }
  }

  scrollControlPaneToNotifications = () => {
    setTimeout(() => {
      if (this.containerRef) {
        const notifications = document.getElementsByClassName('creation-view-controls-notifications-footer')[0]
        if (notifications && notifications.scrollIntoView) {
          notifications.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }
    }, 0)
  }

  renderEditButton(isLoaded) {
    const { monacoEditor, portals, i18n } = this.props
    const { editorReadOnly } = this.state
    const { editBtn } = portals || Portals
    if (monacoEditor && editBtn && isLoaded) {
      const portal = document.getElementById(editBtn)
      if (portal) {
        const { showSecrets, controlData } = this.state
        let { showEditor } = this.state
        const handleToggle = () => {
          if (showEditor) {
            localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
          } else {
            localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
          }
          showEditor = !showEditor
          this.setState({ showEditor })

          // if was closed before and now open
          // secrets may be shown, so hide if necessary
          if (showEditor && !showSecrets) {
            const showControl = controlData.find(({ id: idCtrl }) => idCtrl === 'showSecrets')
            if (showControl) {
              showControl.active = false
              this.handleControlChange(showControl, controlData)
            }
          }
        }
        this.renderedPortals = true
        return ReactDOM.createPortal(
          <div className="edit-template-switch">
            <Switch
              id="edit-yaml"
              key={`is${showEditor}`}
              isChecked={showEditor}
              label={i18n ? i18n(editorReadOnly ? 'edit.yaml.on.ro' : 'edit.yaml.on') : 'Show Yaml'}
              labelOff={i18n ? i18n('edit.yaml.off') : 'Hide Yaml'}
              onChange={handleToggle}
            />
          </div>,
          portal
        )
      }
    }
    return null
  }

  renderCreateButton(isLoaded) {
    const { showWizard, isEditing, controlData, showEditor } = this.state
    const { portals, createControl = {}, i18n } = this.props
    const { createBtn } = portals || Portals
    if (createBtn && !showWizard && isLoaded) {
      const { hasPermissions = true } = createControl
      const titleText = !hasPermissions ? (i18n ? i18n('button.save.access.denied') : 'Denied') : undefined
      let disableButton = true
      if (this.isDirty && hasPermissions) {
        disableButton = false
      }
      const portal = document.getElementById(createBtn)
      const label = isEditing ? (i18n ? i18n('button.update') : 'Update') : i18n ? i18n('button.create') : 'Create'

      const onClick = () => {
        this.setState((state) => ({
          ...state,
          notifications: [],
        }))

        const validations = controlData.map((cd) => cd.validate).filter(Boolean)
        if (validations.length) {
          Promise.all(validations.map((v) => v())).then((results) => {
            const hasErrors = results.some((result) => !isEmpty(result))
            if (hasErrors) {
              this.setState((state) => ({
                ...state,
                notifications: [{ exception: 'Please fix the form errors' }],
              }))
              this.forceUpdate()

              setTimeout(() => {
                const viewClassname = showEditor ? 'creation-view-controls' : 'SplitPane  vertical '
                document.getElementsByClassName(viewClassname)[0].scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth',
                })
              }, 100)
              return
            } else {
              this.handleCreateResource()
            }
          })
        } else {
          this.handleCreateResource()
        }
      }
      const button = (
        <Button
          id={`${createBtn}-btn`}
          onClick={onClick.bind(this)}
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

  handleCreateResource(noRedirect) {
    const { createControl } = this.props
    const { createResource } = createControl
    const resourceJSON = this.getResourceJSON()
    if (resourceJSON) {
      this.setState({ resourceJSON })
      createResource(resourceJSON, noRedirect)
      return resourceJSON
    }
  }

  renderCancelButton() {
    const { showWizard } = this.state
    const { portals, i18n } = this.props
    const { cancelBtn } = portals || Portals
    if (cancelBtn && !showWizard) {
      const portal = document.getElementById(cancelBtn)
      if (portal) {
        return ReactDOM.createPortal(
          <Button id={cancelBtn} onClick={this.handleCancelCreate.bind(this)} variant={'secondary'}>
            {i18n ? i18n('button.cancel') : 'Cancel'}
          </Button>,
          portal
        )
      }
    }
    return null
  }

  handleCancelCreate() {
    const { createControl } = this.props
    const { cancelCreate } = createControl
    cancelCreate()
  }

  resetEditor() {
    const { controlData: initialControlData, onControlInitialize } = this.props
    const { template, editStack = {}, resetInx, editor, i18n } = this.state
    const cd = cloneDeep(initialControlData)
    const controlData = initializeControls(cd, editor, onControlInitialize, i18n)
    const otherYAMLTabs = []
    if (editStack.initialized) {
      delete editStack.initialized
    }
    const { templateYAML, templateObject, templateResources, immutableRows } = generateSource(
      template,
      editStack,
      controlData,
      otherYAMLTabs
    )
    this.setState({
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
      immutableRows,
    })
    this.isDirty = false
    this.selectedTab = 0
    this.firstGoToLinePerformed = false
    this.editors = []
  }
}
