'use strict'

import React from 'react'
import { Query } from 'react-apollo'
import PropTypes from 'prop-types'
import { Alert } from '@patternfly/react-core'
import classNames from 'classnames'
import ControlPanelAccordion from './ControlPanelAccordion'
import ControlPanelTextInput from './ControlPanelTextInput'
import ControlPanelComboBox from './ControlPanelComboBox'
import ControlPanelTextArea from './ControlPanelTextArea'
import ControlPanelNumber from './ControlPanelNumber'
import ControlPanelCheckbox from './ControlPanelCheckbox'
import ControlPanelSingleSelect from './ControlPanelSingleSelect'
import ControlPanelTreeSelect from './ControlPanelTreeSelect'
import ControlPanelMultiSelect from './ControlPanelMultiSelect'
import ControlPanelCards from './ControlPanelCards'
import ControlPanelTable from './ControlPanelTable'
import ControlPanelLabels from './ControlPanelLabels'
import ControlPanelValues from './ControlPanelValues'
import ControlPanelWizard from './ControlPanelWizard'
import ControlPanelPrompt from './ControlPanelPrompt'
import ControlPanelSkeleton from './ControlPanelSkeleton'
import '../css/control-panel.css'
import { TrashIcon, AddIcon } from '../icons/Icons'

class ControlPanel extends React.Component {
  static propTypes = {
    controlData: PropTypes.array,
    controlProps: PropTypes.object,
    creationStatus: PropTypes.string,
    fetchData: PropTypes.object,
    handleCancelCreate: PropTypes.func,
    handleControlChange: PropTypes.func,
    handleCreateResource: PropTypes.func,
    handleGroupChange: PropTypes.func,
    handleNewEditorMode: PropTypes.func,
    i18n: PropTypes.func,
    isCustomName: PropTypes.bool,
    isEditing: PropTypes.bool,
    isLoaded: PropTypes.bool,
    notifications: PropTypes.array,
    onChange: PropTypes.func,
    onStepChange: PropTypes.func,
    originalControlData: PropTypes.array,
    resetStatus: PropTypes.func,
    setEditorReadOnly: PropTypes.func,
    showEditor: PropTypes.bool,
    showPortals: PropTypes.object,
    templateYAML: PropTypes.any,
  }

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.refreshFading()
  }

  setCreationViewRef = (ref) => {
    this.creationView = ref
  }

  setCreationViewBottomBlurrRef = (ref) => {
    this.creationViewBottomBlurrRef = ref
  }

  refreshFading = () => {
    if (this.creationViewBottomBlurrRef) {
      const hasScrollbar = this.creationView.scrollHeight > this.creationView.clientHeight
      const towardsBottom =
        this.creationView.scrollTop + this.creationView.clientHeight > this.creationView.scrollHeight - 20
      this.creationViewBottomBlurrRef.style.display = hasScrollbar && !towardsBottom ? 'block' : 'none'
    }
  }

  setWizardRef = (ref) => {
    this.wizardRef = ref
  }

  setControlSectionRef = (title, ref) => {
    title.sectionRef = ref
  }

  render() {
    const { controlData, showEditor } = this.props
    const controlClasses = classNames({
      'creation-view-controls': true,
      'pf-c-form': true,
      showEditor,
    })
    return (
      <div className="creation-view-controls-container">
        {this.renderControlFormOrWizard(controlData, controlClasses)}
      </div>
    )
  }

  renderControlFormOrWizard(controlData, controlClasses) {
    let step
    let section
    let content = []
    const steps = []
    let sections = []
    let activeStep
    let activeSection
    let stopRendering = false
    let stopRenderingOnNextControl = false
    controlData.forEach((control, inx) => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      const isHidden = this.isHidden(control, controlData)
      if (!stopRendering) {
        switch (type) {
          case 'step':
          case 'review':
            if (!activeStep) {
              if (content.length && !activeSection) {
                section = {
                  title: { id: `section${inx}`, type: 'section' },
                  content,
                }
                sections.push(section)
              }
              if (activeSection) {
                step = { title: { id: `step${inx}`, type: 'step' }, sections }
                steps.push(step)
              }
            }
            sections = []
            content = []
            activeSection = null
            activeStep = { title: control, sections }
            if (!isHidden) {
              steps.push(activeStep)
            }
            break
          case 'section':
            if (content.length && !activeSection) {
              section = {
                title: { id: `section${inx}`, type: 'section' },
                content,
              }
              sections.push(section)
            }
            content = []
            activeSection = { title: control, content }
            if (!isHidden) {
              sections.push(activeSection)
            }
            break
          default:
            if (!activeSection) {
              activeSection = {
                title: { id: `section${inx}`, type: 'section' },
                content,
              }
              sections.push(activeSection)
            }
            content.push(control)
            break
        }
      }
    })
    // if no steps, just do a form test
    if (steps.length === 0) {
      return this.renderControlForm(sections, controlClasses)
    } else {
      // else do a wizard
      return this.renderControlWizard(steps, controlClasses, controlData)
    }
  }

  renderControlForm(sections, controlClasses) {
    return (
      <React.Fragment>
        <div className={controlClasses} ref={this.setCreationViewRef} onScroll={this.refreshFading.bind(this)}>
          {this.renderPortals()}
          <div id="notifications" />
          {this.renderNotifications(true)}
          <div className="content">{this.renderControlSections(sections)}</div>
        </div>
      </React.Fragment>
    )
  }

  renderControlWizard(steps, controlClasses, controlData) {
    const {
      onStepChange,
      handleCreateResource,
      handleCancelCreate,
      setEditorReadOnly,
      resetStatus,
      isEditing,
      creationStatus,
    } = this.props
    return (
      <ControlPanelWizard
        steps={steps}
        controlData={controlData}
        controlClasses={controlClasses}
        onStepChange={onStepChange}
        setWizardRef={this.setWizardRef.bind(this)}
        handleCreateResource={handleCreateResource}
        handleCancelCreate={handleCancelCreate}
        renderControlSections={this.renderControlSections.bind(this)}
        renderNotifications={this.renderNotifications.bind(this)}
        setEditorReadOnly={setEditorReadOnly}
        resetStatus={resetStatus}
        isEditing={isEditing}
        creationStatus={creationStatus}
      />
    )
  }

  renderControlSections(controlSections, grpId = '') {
    return controlSections.map(({ title, content: _content }) => {
      const { id, collapsed = false, shadowed } = title
      const sectionClasses = classNames({
        'creation-view-controls-section': true,
        shadowed,
        collapsed,
      })
      title.content = _content
      return (
        <React.Fragment key={id}>
          {this.renderControl(id, 'section', title, grpId)}
          <div className={sectionClasses} ref={this.setControlSectionRef.bind(this, title)}>
            {this.renderControls(_content, grpId)}
          </div>
        </React.Fragment>
      )
    })
  }

  renderControls(controlData, grpId) {
    return (
      <React.Fragment>
        {controlData.map((control, i) => {
          const { id = `${control.type}-${i}`, type } = control
          switch (type) {
            case 'group':
              return this.renderGroup(control, grpId)
            default:
              return this.renderControlWithFetch(id, type, control, grpId)
          }
        })}
      </React.Fragment>
    )
  }

  renderGroup(control, grpId = '') {
    const { id, active = [], hidden, prompts } = control
    active.forEach((controlData) => {
      controlData.forEach((ctrl) => {
        ctrl.group = control
      })
    })
    const isHidden = typeof hidden === 'function' ? hidden() : hidden
    return (
      !isHidden && (
        <React.Fragment key={id}>
          {active.map((controlData, inx) => {
            const groupId = inx > 0 ? `${grpId}grp${inx}` : ''

            const card = controlData.find(({ type }) => type === 'cards')
            const groupType = card && Array.isArray(card.active) ? card.active.join() : 'general'

            return (
              /* eslint-disable-next-line react/no-array-index-key */
              <React.Fragment key={`${controlData[0].id}Group${inx}`}>
                <div className="creation-view-group-container" key={groupType}>
                  {prompts && active.length > 1 && this.renderDeleteGroupButton(control, inx)}
                  {this.renderGroupControlSections(controlData, inx, groupId)}
                </div>
                {prompts && active.length - 1 === inx && this.renderAddGroupButton(control)}
              </React.Fragment>
            )
          })}
        </React.Fragment>
      )
    )
  }

  renderGroupControlSections(controlData, grpNum, grpId = '') {
    // create collapsable control sections
    let section
    let content = []
    let stopRendering = false
    let stopRenderingOnNextControl = false
    const controlSections = []
    controlData.forEach((control) => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      if (!stopRendering) {
        if (type === 'section') {
          control.grpNum = grpNum
          content = []
          section = { title: control, content }
          controlSections.push(section)
        } else {
          content.push(control)
        }
      }
    })
    return this.renderControlSections(controlSections, grpId)
  }

  // if data for 'available' is fetched from server, use apollo component
  renderControlWithFetch(id, type, control, grpId) {
    const { fetchAvailable } = control
    if (fetchAvailable) {
      const { query, setAvailable } = fetchAvailable
      let { variables } = fetchAvailable
      if (typeof variables === 'function') {
        variables = variables(control, this.props.controlData)
      }
      const refetch = (func) => {
        delete control.isLoaded
        control.isRefetching = true
        control.forceUpdate()
        func()
          .then((data) => {
            control.isRefetching = false
            setAvailable(control, { data })
            control.forceUpdate()
          })
          .catch((err) => {
            control.isRefetching = false
            setAvailable(control, { error: err })
            control.forceUpdate()
          })
      }

      if (typeof query === 'function') {
        if (!control.isLoaded) {
          if (!control.isLoading) {
            setAvailable(control, { loading: true })
            query()
              .then((data) => {
                setAvailable(control, { loading: false, data })
                control.forceUpdate()
              })
              .catch((err) => {
                setAvailable(control, { loading: false, error: err })
                control.forceUpdate()
              })
          }
        }
        fetchAvailable.refetch = refetch.bind(this, query)
      } else {
        return (
          <Query query={query} key={id} variables={variables}>
            {(result) => {
              fetchAvailable.refetch = refetch.bind(this, result.refetch)
              setAvailable(control, result)
              return this.renderControlWithPrompt(id, type, control, grpId)
            }}
          </Query>
        )
      }
    }
    return this.renderControlWithPrompt(id, type, control, grpId)
  }

  // if data for 'available' is fetched from server, use apollo component
  renderControlWithPrompt(id, type, control, grpId) {
    const { prompts } = control
    if (prompts) {
      const { positionAboveControl } = prompts
      if (positionAboveControl) {
        return (
          <React.Fragment key={id}>
            {this.renderControlPrompt(control)}
            {this.renderControl(id, type, control, grpId)}
          </React.Fragment>
        )
      } else {
        return (
          <React.Fragment key={id}>
            {this.renderControl(id, type, control, grpId)}
            {this.renderControlPrompt(control)}
          </React.Fragment>
        )
      }
    }
    return this.renderControl(id, type, control, grpId)
  }

  renderControlPrompt(control) {
    const { i18n } = this.props
    return (
      <ControlPanelPrompt
        control={control}
        handleAddActive={(items) => this.handleAddActive(control, items)}
        i18n={i18n}
      />
    )
  }

  handleAddActive = (control, items) => {
    control.active = items
    this.props.handleControlChange(control, this.props.controlData, this.creationView, this.props.isCustomName)
  }

  renderControl(id, type, control, grpId) {
    const { controlData, showEditor, isLoaded, i18n, templateYAML, handleCreateResource, controlProps } = this.props
    if (this.isHidden(control, controlData)) {
      return null
    }
    const controlId = `${id}${grpId}`.replace('name', 'eman').replace('address', 'sserdda')
    control.controlId = controlId
    if (!isLoaded && !['title', 'section', 'hidden'].includes(type)) {
      return <ControlPanelSkeleton key={controlId} controlId={controlId} control={control} i18n={i18n} />
    }
    switch (type) {
      case 'title':
      case 'section':
        return (
          <ControlPanelAccordion
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'text':
      case 'password':
        return (
          <ControlPanelTextInput
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'textarea':
        return (
          <ControlPanelTextArea
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'singleselect':
        return (
          <ControlPanelSingleSelect
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'number':
        return (
          <ControlPanelNumber
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'combobox':
        return (
          <ControlPanelComboBox
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
            handleControlChange={this.handleControlChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'multiselect':
        return (
          <ControlPanelMultiSelect
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'treeselect':
        return (
          <ControlPanelTreeSelect
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'cards':
        return (
          <ControlPanelCards
            key={controlId}
            controlId={controlId}
            control={control}
            showEditor={showEditor}
            handleChange={this.handleCardChange.bind(this, control)}
            i18n={i18n}
            fetchData={this.props.fetchData}
          />
        )
      case 'table':
        return (
          <ControlPanelTable
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleControlChange.bind(this, control)}
            i18n={i18n}
            fetchData={this.props.fetchData}
          />
        )
      case 'labels':
        return (
          <ControlPanelLabels
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleControlChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'values':
        return (
          <ControlPanelValues
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleControlChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'checkbox':
      case 'radio':
        return (
          <ControlPanelCheckbox
            key={controlId}
            controlId={controlId}
            control={control}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'custom':
        return (
          <React.Fragment key={controlId}>
            {this.renderCustom(control, controlId, templateYAML, handleCreateResource, controlProps)}
          </React.Fragment>
        )
    }
    return null
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  }

  renderCustom(control, controlId, templateYAML, handleCreateResource, controlProps) {
    const { i18n } = this.props
    const { component } = control
    const custom = React.cloneElement(component, {
      control,
      i18n,
      controlId,
      handleChange: this.handleChange.bind(this, control),
      templateYAML,
      handleCreateResource,
      controlProps,
    })
    return (
      <React.Fragment>
        <div className="creation-view-controls-custom" ref={this.setControlRef.bind(this, control)}>
          {custom}
        </div>
      </React.Fragment>
    )
  }

  handleChange(control) {
    let updateName = false
    let { isCustomName } = this.props
    const { controlData, originalControlData, onChange } = this.props
    const { id: field, type, syncWith, syncedWith } = control

    if (onChange) {
      control.refresh = () => this.props.handleControlChange(control, controlData)
      onChange(control)
    }

    switch (type) {
      case 'text':
        isCustomName = field === 'name'
        break
      case 'multiselect':
        // if user was able to select something that automatically
        // generates the name, blow away the user name
        updateName = !isCustomName && control.updateNamePrefix
        break
    }

    // update name if spec changed
    if (updateName) {
      let cname
      const nname = controlData.find(({ id }) => id === 'name')
      if (nname) {
        if (control.active.length > 0) {
          cname = control.updateNamePrefix + control.availableMap[control.active[0]].name.replace(/\W/g, '-')
        } else {
          cname = originalControlData.find(({ id }) => id === 'name').active
        }
        nname.active = cname.toLowerCase()
      }
    }

    // syncing values
    if (syncWith && control.groupControlData) {
      // whatever is typed into this control, also put in other control
      const syncControl = control.groupControlData.find(({ id }) => id === syncWith)
      syncControl.active = `${control.active}${syncControl.syncedSuffix || ''}`
    }
    if (syncedWith && control.groupControlData) {
      // if another control is synced with this control and
      // user is typing a value here directly, remove sync
      const syncedControl = control.groupControlData.find(({ id }) => id === syncedWith)
      delete control.syncedWith
      delete syncedControl.syncWith
    }
    this.props.handleControlChange(control, controlData, isCustomName)
    return field
  }

  handleCardChange(control, selection) {
    const { controlData, isCustomName } = this.props
    const { multiselect, newEditorMode } = control
    if (!newEditorMode) {
      if (!multiselect) {
        control.active = selection
      } else {
        if (!control.active) {
          control.active = [selection]
        } else {
          const inx = control.active.indexOf(selection)
          if (inx === -1) {
            control.active.push(selection)
          } else {
            control.active.splice(inx, 1)
          }
        }
      }
      this.props.handleControlChange(control, controlData, this.creationView, isCustomName)
    } else {
      control.active = []
      if (selection) {
        control.active.push(selection)
      }
      this.props.handleNewEditorMode(control, controlData, this.creationView, this.wizardRef)
    }
  }

  handleControlChange(control) {
    const { controlData, onChange } = this.props
    if (onChange) {
      control.refresh = () => this.props.handleControlChange(control, controlData)
      onChange(control)
    }
    this.props.handleControlChange(control, controlData)
  }

  renderPortals() {
    const { showPortals } = this.props
    if (showPortals) {
      return (
        <div className="creation-view-portals">
          {Object.values(showPortals).map((id) => {
            return <div id={id} key={id} />
          })}
        </div>
      )
    }
    return null
  }

  renderNotifications(isForm) {
    const { notifications = [] } = this.props
    const margin = isForm ? '20px' : '20px 0'
    if (notifications.length > 0) {
      return (
        <React.Fragment>
          <div className="creation-view-controls-notifications" style={{ margin }}>
            {notifications.map(({ exception, variant = 'danger' }) => {
              return <Alert key={exception} variant={variant} title={exception} isInline></Alert>
            })}
          </div>
          <div className="creation-view-controls-notifications-footer" />
        </React.Fragment>
      )
    }
    return null
  }

  renderDeleteGroupButton(control, inx) {
    const { i18n, controlData } = this.props
    const {
      prompts: { deletePrompt },
    } = control
    const handleGroupChange = () => {
      this.props.handleGroupChange(control, controlData, this.creationView, inx)
    }
    const handleGroupChangeKey = (e) => {
      if (e.type === 'click' || e.key === 'Enter') {
        handleGroupChange()
      }
    }
    const text = i18n(deletePrompt)
    return (
      <div
        className="creation-view-controls-delete-button"
        tabIndex="0"
        role={'button'}
        title={text}
        aria-label={text}
        onClick={handleGroupChange}
        onKeyPress={handleGroupChangeKey}
      >
        <TrashIcon />
      </div>
    )
  }

  renderAddGroupButton(control) {
    const { i18n, controlData } = this.props
    const {
      prompts: { addPrompt },
    } = control
    const handleGroupChange = () => {
      this.props.handleGroupChange(control, controlData, this.creationView)
    }
    const handleGroupChangeKey = (e) => {
      if (e.type === 'click' || e.key === 'Enter') {
        handleGroupChange()
      }
    }
    const text = i18n(addPrompt)
    return (
      <div className="creation-view-controls-add-value-container">
        <div
          id={`add-${control.id}`}
          className="creation-view-controls-add-button"
          tabIndex="0"
          role={'button'}
          title={text}
          aria-label={text}
          onClick={handleGroupChange}
          onKeyPress={handleGroupChangeKey}
        >
          {text}
          <AddIcon className="icon" />
        </div>
      </div>
    )
  }

  isHidden(control, controlData) {
    const { hidden } = control
    return hidden === true || hidden === 'true' || (typeof hidden === 'function' && hidden(control, controlData))
  }
}

export default ControlPanel
