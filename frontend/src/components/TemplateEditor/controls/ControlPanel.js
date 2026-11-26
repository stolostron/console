/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { Alert, Button, Grid, GridItem } from '@patternfly/react-core'
import { MinusCircleIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import '../css/control-panel.css'
import { partitionGroupSections } from '../utils/groupControlUtils'
import ControlPanelAccordion from './ControlPanelAccordion'
import ControlPanelBoolean from './ControlPanelBoolean'
import ControlPanelCards from './ControlPanelCards'
import ControlPanelCheckbox from './ControlPanelCheckbox'
import ControlPanelComboBox from './ControlPanelComboBox'
import ControlPanelLabels from './ControlPanelLabels'
import ControlPanelMultiSelect from './ControlPanelMultiSelect'
import ControlPanelNumber from './ControlPanelNumber'
import ControlPanelPrompt from './ControlPanelPrompt'
import ControlPanelSingleSelect from './ControlPanelSingleSelect'
import ControlPanelSkeleton from './ControlPanelSkeleton'
import ControlPanelTextArea from './ControlPanelTextArea'
import ControlPanelTextInput from './ControlPanelTextInput'
import ControlPanelMultiTextInput from './ControlPanelMultiTextInput'
import ControlPanelTreeSelect from './ControlPanelTreeSelect'
import ControlPanelValues from './ControlPanelValues'
import ControlPanelWizard from './ControlPanelWizard'
import { isControlHidden } from '../utils/controlPredicates'

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
    originalControlData: PropTypes.array,
    resetStatus: PropTypes.func,
    setEditorReadOnly: PropTypes.func,
    showEditor: PropTypes.bool,
    showPortals: PropTypes.object,
    templateYAML: PropTypes.any,
    backButtonOverride: PropTypes.func,
    wizardTitle: PropTypes.string,
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
      'pf-v6-c-form': true,
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
      handleCreateResource,
      handleCancelCreate,
      setEditorReadOnly,
      resetStatus,
      isEditing,
      creationStatus,
      backButtonOverride,
      i18n,
      wizardTitle,
    } = this.props
    return (
      <ControlPanelWizard
        i18n={i18n}
        steps={steps}
        controlData={controlData}
        controlClasses={controlClasses}
        setWizardRef={this.setWizardRef.bind(this)}
        handleCreateResource={handleCreateResource}
        handleCancelCreate={handleCancelCreate}
        renderControlSections={this.renderControlSections.bind(this)}
        renderNotifications={this.renderNotifications.bind(this)}
        setEditorReadOnly={setEditorReadOnly}
        resetStatus={resetStatus}
        isEditing={isEditing}
        creationStatus={creationStatus}
        backButtonOverride={backButtonOverride}
        wizardTitle={wizardTitle}
      />
    )
  }

  renderControlSections(controlSections, grpId = '') {
    return controlSections.map(({ title, content: _content }) => {
      const { id, collapsed = false, shadowed, title: sectionTitle, subtitle } = title
      const sectionLabel = typeof sectionTitle === 'string' ? sectionTitle : subtitle
      // Include grpId so repeated group copies get unique content IDs; first copy keeps grpId ''.
      const sectionContentId = `${id || ''}${grpId}-${sectionLabel || ''}-content`
        .replaceAll(/\s+/g, '-')
        .toLowerCase()
      const sectionClasses = classNames({
        'creation-view-controls-section': true,
        shadowed,
        collapsed,
      })
      const sectionContainerClasses = classNames({
        'creation-view-group-subcontainer': title.subgroup,
      })
      title.content = _content
      title.sectionContentId = sectionContentId
      return (
        <React.Fragment key={`${id}${grpId}`}>
          <div className={sectionContainerClasses}>
            {this.renderControl(id, 'section', title, grpId)}
            <div id={sectionContentId} className={sectionClasses} ref={this.setControlSectionRef.bind(this, title)}>
              {this.renderControls(_content, grpId)}
            </div>
          </div>
        </React.Fragment>
      )
    })
  }

  renderControls(controlData, grpId) {
    const nodes = []
    let rowId = null
    let rowItems = []

    const flushRow = () => {
      if (rowItems.length === 0) {
        return
      }
      const rowControlId = rowItems[0]?.id || 'row'
      nodes.push(
        <Grid key={`form-row-${grpId || 'root'}-${rowId}-${rowControlId}`} hasGutter className="creation-view-form-row">
          {rowItems.map(({ id, type, control }) => (
            <GridItem key={id} md={6}>
              {this.renderControlWithFetch(id, type, control, grpId)}
            </GridItem>
          ))}
        </Grid>
      )
      rowItems = []
      rowId = null
    }

    controlData.forEach((control, i) => {
      const { id = `${control.type}-${i}`, type, formRow } = control
      if (type === 'group') {
        flushRow()
        nodes.push(this.renderGroup(control, grpId))
        return
      }
      if (formRow) {
        if (rowId && rowId !== formRow) {
          flushRow()
        }
        rowId = formRow
        rowItems.push({ id, type, control })
        return
      }
      flushRow()
      nodes.push(this.renderControlWithFetch(id, type, control, grpId))
    })
    flushRow()

    return <React.Fragment>{nodes}</React.Fragment>
  }

  canDeleteGroup(control, inx) {
    const { prompts, startWithNone, active = [] } = control
    if (!prompts) {
      return false
    }
    return (
      startWithNone ||
      (prompts.disableDeleteForFirst && inx > 0) ||
      (!prompts.disableDeleteForFirst && active.length > 1)
    )
  }

  renderGroup(control, grpId = '') {
    const { id, active = [], hidden, prompts, startWithNone } = control
    active.forEach((controlData) => {
      controlData.forEach((ctrl) => {
        ctrl.group = control
        ctrl.groupControlData = controlData
      })
    })
    const isHidden = typeof hidden === 'function' ? hidden() : hidden
    // shows add button only when no mappings and startWithNone is true
    if (startWithNone && active.length === 0) {
      return (
        prompts?.addPrompt && (
          <div className="storage-mapping-buttons" key={id}>
            {this.renderAddGroupButton(control)}
          </div>
        )
      )
    }
    return (
      !isHidden && (
        <React.Fragment key={id}>
          {active.map((controlData, inx) => {
            const groupId = inx > 0 ? `${grpId}grp${inx}` : ''

            const card = controlData.find(({ type }) => type === 'cards')
            const groupType = card && Array.isArray(card.active) ? card.active.join() : 'general'
            const showDelete = this.canDeleteGroup(control, inx)
            const section = controlData.find(({ type }) => type === 'section')
            if (section) {
              section.headerAction =
                showDelete && prompts?.deleteLabel ? this.renderDeleteGroupButton(control, inx) : undefined
            }

            return (
              <React.Fragment key={`${controlData[0].id}Group${inx}`}>
                <div className="creation-view-group-container" key={groupType}>
                  {showDelete && !prompts?.deleteLabel && this.renderDeleteGroupButton(control, inx)}
                  {this.renderGroupControlSections(controlData, inx, groupId)}
                </div>
                {prompts && prompts.addPrompt && active.length - 1 === inx && this.renderAddGroupButton(control)}
              </React.Fragment>
            )
          })}
        </React.Fragment>
      )
    )
  }

  renderGroupControlSections(controlData, grpNum, grpId = '') {
    const controlSections = partitionGroupSections(controlData, grpNum)
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

      if (!control.isLoaded) {
        if (!control.isLoading) {
          setAvailable(control, { loading: true })
          query()
            .then((data) => {
              setAvailable(control, { loading: false, data, i18n: this.props.i18n })
              control.forceUpdate()
            })
            .catch((err) => {
              setAvailable(control, { loading: false, error: err })
              control.forceUpdate()
            })
        }
      }
      fetchAvailable.refetch = refetch.bind(this, query)
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
            controlData={controlData}
            handleChange={this.handleChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'multitext':
        return (
          <ControlPanelMultiTextInput
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
            handleChange={this.handleControlChange.bind(this, control)}
            i18n={i18n}
            addButtonText={control.addButtonText}
          />
        )
      case 'textarea':
        return (
          <ControlPanelTextArea
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
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
            controlData={controlData}
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
            controlData={controlData}
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
            controlData={controlData}
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
            controlData={controlData}
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
            controlData={controlData}
            showEditor={showEditor}
            handleChange={this.handleCardChange.bind(this, control)}
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
            controlData={controlData}
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
            controlData={controlData}
            handleChange={this.handleControlChange.bind(this, control)}
            i18n={i18n}
          />
        )
      case 'boolean':
        return (
          <ControlPanelBoolean
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
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
            controlData={controlData}
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
    const { i18n, controlData } = this.props
    const { component } = control
    const custom = React.cloneElement(component, {
      control,
      // Always pass the live initialized controlData (not a stale getControlData closure).
      controlData,
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
          cname = control.updateNamePrefix + control.availableMap[control.active[0]].name.replaceAll(/\W/g, '-')
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
    const { controlData } = this.props
    const {
      prompts: { deletePrompt, deleteLabel },
    } = control
    const handleGroupChange = () => {
      this.props.handleGroupChange(control, controlData, this.creationView, inx)
    }
    if (deleteLabel) {
      return (
        <Button
          variant="link"
          isDanger
          isInline
          icon={<MinusCircleIcon />}
          tabIndex="0"
          title={deletePrompt || deleteLabel}
          aria-label={deletePrompt || deleteLabel}
          onClick={handleGroupChange}
          style={{ marginRight: '10px' }}
        >
          {deleteLabel}
        </Button>
      )
    }
    return (
      <Button
        icon={<TrashIcon />}
        variant="plain"
        className="creation-view-controls-delete-button"
        tabIndex="0"
        title={deletePrompt}
        aria-label={deletePrompt}
        onClick={handleGroupChange}
        size="sm"
      />
    )
  }

  renderAddGroupButton(control) {
    const { controlData } = this.props
    const {
      prompts: { addPrompt },
    } = control
    const handleGroupChange = () => {
      this.props.handleGroupChange(control, controlData, this.creationView)
    }

    return (
      <Button id={`add-${control.id}`} variant="link" onClick={handleGroupChange} icon={<PlusCircleIcon />} size="sm">
        {addPrompt}
      </Button>
    )
  }

  isHidden(control, controlData) {
    return isControlHidden(control, controlData)
  }
}

export default ControlPanel
