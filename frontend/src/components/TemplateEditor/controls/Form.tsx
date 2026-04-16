/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { Alert, Button } from '@patternfly/react-core'
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import classNames from 'classnames'
import React, { useEffect, useRef } from 'react'
import { ControlPanelProps, TemplateControl, WizardStepStructure } from '../types'
import '~/components/TemplateEditor/css/control-panel.css'
import ControlPanelAccordion from './Accordion'
import ControlPanelBoolean from './Boolean'
import ControlPanelCards from './Cards'
import ControlPanelCheckbox from './Checkbox'
import ControlPanelComboBox from './ComboBox'
import ControlPanelLabels from './Labels'
import ControlPanelMultiSelect from './MultiSelect'
import ControlPanelNumber from './Number'
import ControlPanelPrompt from './Prompt'
import ControlPanelSingleSelect from './SingleSelect'
import ControlPanelSkeleton from './Skeleton'
import ControlPanelTextArea from './TextArea'
import ControlPanelTextInput from './TextInput'
import ControlPanelMultiTextInput from './MultiTextInput'
import ControlPanelTreeSelect from './TreeSelect'
import ControlPanelValues from './Values'
import ControlPanelWizard from './Wizard'

type SectionTitle = TemplateControl | { id: string; type: string; subgroup?: boolean; content?: TemplateControl[] }

type PanelSection = {
  title: SectionTitle
  content: TemplateControl[]
}

type PanelStep = { title: SectionTitle; sections: PanelSection[] }

export default function Form(props: ControlPanelProps) {
  const creationViewRef = useRef<HTMLDivElement | null>(null)
  const creationViewBottomBlurrRef = useRef<HTMLDivElement | null>(null)
  const wizardRef = useRef<unknown>(undefined)

  const refreshFading = () => {
    const creationView = creationViewRef.current
    const bottomBlur = creationViewBottomBlurrRef.current
    if (bottomBlur && creationView) {
      const hasScrollbar = creationView.scrollHeight > creationView.clientHeight
      const towardsBottom = creationView.scrollTop + creationView.clientHeight > creationView.scrollHeight - 20
      bottomBlur.style.display = hasScrollbar && !towardsBottom ? 'block' : 'none'
    }
  }

  useEffect(() => {
    refreshFading()
  }, [])

  const setCreationViewRef = (ref: HTMLDivElement | null) => {
    creationViewRef.current = ref
  }

  const setWizardRef = (ref: unknown) => {
    wizardRef.current = ref
  }

  const setControlSectionRef = (title: TemplateControl, ref: HTMLDivElement | null) => {
    title.sectionRef = ref
  }

  function renderControlFormOrWizard(controlData: TemplateControl[], controlClasses: string): React.ReactNode {
    let step: PanelStep | undefined
    let section: PanelSection | undefined
    let content: TemplateControl[] = []
    const steps: PanelStep[] = []
    let sections: PanelSection[] = []
    let activeStep: PanelStep | undefined
    let activeSection: PanelSection | undefined
    let stopRendering = false
    let stopRenderingOnNextControl = false
    controlData.forEach((control, inx) => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      const controlHidden = isHidden(control, controlData)
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
            activeSection = undefined
            activeStep = { title: control, sections }
            if (!controlHidden) {
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
            if (!controlHidden) {
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
      return renderControlForm(sections, controlClasses)
    } else {
      // else do a wizard
      return renderControlWizard(steps, controlClasses, controlData)
    }
  }

  function renderControlForm(sections: PanelSection[], controlClasses: string): React.ReactNode {
    return (
      <React.Fragment>
        <div className={controlClasses} ref={setCreationViewRef} onScroll={refreshFading}>
          {renderPortals()}
          <div id="notifications" />
          {renderNotifications(true)}
          <div className="content">{renderControlSections(sections)}</div>
        </div>
      </React.Fragment>
    )
  }

  function renderControlWizard(
    steps: PanelStep[],
    controlClasses: string,
    controlData: TemplateControl[]
  ): React.ReactNode {
    const {
      handleCreateResource,
      handleCancelCreate,
      setEditorReadOnly,
      resetStatus,
      isEditing,
      creationStatus,
      backButtonOverride,
      i18n,
    } = props
    return (
      <ControlPanelWizard
        i18n={i18n}
        steps={steps as WizardStepStructure[]}
        controlData={controlData}
        controlClasses={controlClasses}
        setWizardRef={setWizardRef}
        handleCreateResource={handleCreateResource}
        handleCancelCreate={handleCancelCreate}
        renderControlSections={renderControlSections}
        renderNotifications={renderNotifications}
        setEditorReadOnly={setEditorReadOnly}
        resetStatus={resetStatus}
        isEditing={isEditing}
        creationStatus={creationStatus}
        backButtonOverride={backButtonOverride}
      />
    )
  }

  function renderControlSections(controlSections: PanelSection[], grpId = ''): React.ReactNode {
    return controlSections.map(({ title, content: _content }) => {
      const {
        id: sectionId,
        collapsed = false,
        shadowed,
      } = title as SectionTitle & {
        collapsed?: boolean
        shadowed?: boolean
      }
      const id = sectionId ?? 'section'
      const sectionClasses = classNames({
        'creation-view-controls-section': true,
        shadowed,
        collapsed,
      })
      const sectionContainerClasses = classNames({
        'creation-view-group-subcontainer': title.subgroup,
      })
      ;(title as SectionTitle & { content?: TemplateControl[] }).content = _content
      return (
        <React.Fragment key={id}>
          <div className={sectionContainerClasses}>
            {renderControl(id, 'section', title as TemplateControl, grpId)}
            <div className={sectionClasses} ref={(ref) => setControlSectionRef(title as TemplateControl, ref)}>
              {renderControls(_content, grpId)}
            </div>
          </div>
        </React.Fragment>
      )
    })
  }

  function renderControls(controlData: TemplateControl[], grpId?: string): React.ReactNode {
    return (
      <React.Fragment>
        {controlData.map((control, i) => {
          const { type } = control
          const id = control.id ?? `${String(type)}-${i}`
          switch (type) {
            case 'group':
              return renderGroup(control, grpId)
            default:
              return renderControlWithFetch(id, String(type), control, grpId)
          }
        })}
      </React.Fragment>
    )
  }

  function renderGroup(control: TemplateControl, grpId = ''): React.ReactNode {
    const {
      id,
      active = [],
      hidden,
      prompts,
      startWithNone,
    } = control as TemplateControl & {
      active?: TemplateControl[][]
      prompts?: TemplateControl['prompts']
      startWithNone?: boolean
    }
    active.forEach((controlData: TemplateControl[]) => {
      controlData.forEach((ctrl: TemplateControl) => {
        ctrl.group = control
      })
    })
    const isHidden = typeof hidden === 'function' ? (hidden as () => boolean)() : hidden
    // shows add button only when no mappings and startWithNone is true
    if (startWithNone && active.length === 0) {
      return (
        prompts?.addPrompt && (
          <div className="storage-mapping-buttons" key={id}>
            {renderAddGroupButton(control)}
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

            return (
              <React.Fragment key={`${controlData[0].id}Group${inx}`}>
                <div className="creation-view-group-container" key={groupType}>
                  {prompts &&
                    (startWithNone ||
                      (prompts.disableDeleteForFirst && inx > 0) ||
                      (!prompts.disableDeleteForFirst && active.length > 1)) &&
                    renderDeleteGroupButton(control, inx)}
                  {renderGroupControlSections(controlData, inx, groupId)}
                </div>
                {prompts && prompts.addPrompt && active.length - 1 === inx && renderAddGroupButton(control)}
              </React.Fragment>
            )
          })}
        </React.Fragment>
      )
    )
  }

  function renderGroupControlSections(controlData: TemplateControl[], grpNum: number, grpId = ''): React.ReactNode {
    // create collapsable control sections
    let section: PanelSection | undefined
    let content: TemplateControl[] = []
    let stopRendering = false
    let stopRenderingOnNextControl = false
    const controlSections: PanelSection[] = []
    controlData.forEach((control) => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      if (!stopRendering) {
        control.grpNum = grpNum
        if (type === 'section') {
          content = []
          section = { title: control, content }
          controlSections.push(section)
        } else {
          content.push(control)
        }
      }
    })
    return renderControlSections(controlSections, grpId)
  }

  // if data for 'available' is fetched from server, use apollo component
  function renderControlWithFetch(id: string, type: string, control: TemplateControl, grpId?: string): React.ReactNode {
    const { fetchAvailable } = control
    if (fetchAvailable) {
      const { query, setAvailable } = fetchAvailable
      let { variables } = fetchAvailable
      if (typeof variables === 'function') {
        variables = variables(control, props.controlData)
      }
      const refetch = (func: () => Promise<unknown>) => {
        delete control.isLoaded
        control.isRefetching = true
        control.forceUpdate?.()
        func()
          .then((data: unknown) => {
            control.isRefetching = false
            setAvailable(control, { data })
            control.forceUpdate?.()
          })
          .catch((err: unknown) => {
            control.isRefetching = false
            setAvailable(control, { error: err })
            control.forceUpdate?.()
          })
      }

      if (!control.isLoaded) {
        if (!control.isLoading) {
          setAvailable(control, { loading: true })
          query()
            .then((data: unknown) => {
              setAvailable(control, { loading: false, data, i18n: props.i18n })
              control.forceUpdate?.()
            })
            .catch((err: unknown) => {
              setAvailable(control, { loading: false, error: err })
              control.forceUpdate?.()
            })
        }
      }
      fetchAvailable.refetch = () => refetch(query)
    }
    return renderControlWithPrompt(id, type, control, grpId)
  }

  // if data for 'available' is fetched from server, use apollo component
  function renderControlWithPrompt(
    id: string,
    type: string,
    control: TemplateControl,
    grpId?: string
  ): React.ReactNode {
    const { prompts } = control
    if (prompts) {
      const { positionAboveControl } = prompts
      if (positionAboveControl) {
        return (
          <React.Fragment key={id}>
            {renderControlPrompt(control)}
            {renderControl(id, type, control, grpId)}
          </React.Fragment>
        )
      } else {
        return (
          <React.Fragment key={id}>
            {renderControl(id, type, control, grpId)}
            {renderControlPrompt(control)}
          </React.Fragment>
        )
      }
    }
    return renderControl(id, type, control, grpId)
  }

  function renderControlPrompt(control: TemplateControl): React.ReactNode {
    const { i18n } = props
    return (
      <ControlPanelPrompt control={control} handleAddActive={(items) => handleAddActive(control, items)} i18n={i18n} />
    )
  }

  function handleAddActive(control: TemplateControl, items: unknown) {
    control.active = items
    props.handleControlChange(control, props.controlData, creationViewRef.current, props.isCustomName)
  }

  function renderControl(id: string, type: string, control: TemplateControl, grpId?: string): React.ReactNode {
    const { controlData, showEditor, isLoaded, i18n, templateYAML, handleCreateResource, controlProps } = props
    if (isHidden(control, controlData)) {
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
            handleChange={(evt?: unknown) => handleChange(control, evt)}
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
            handleChange={() => handleControlChange(control)}
            i18n={i18n}
            addButtonText={control.addButtonText as string}
          />
        )
      case 'textarea':
        return (
          <ControlPanelTextArea
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
            handleChange={(evt?: unknown) => handleChange(control, evt)}
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
            handleChange={(evt?: unknown) => handleChange(control, evt)}
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
            handleChange={(evt?: unknown) => handleChange(control, evt)}
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
            handleControlChange={() => handleControlChange(control)}
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
            handleChange={(evt?: unknown) => handleChange(control, evt)}
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
            handleChange={(evt?: unknown) => handleChange(control, evt)}
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
            handleChange={(selection: string | null) => handleCardChange(control, selection)}
            i18n={i18n}
            fetchData={props.fetchData}
          />
        )
      case 'labels':
        return (
          <ControlPanelLabels
            key={controlId}
            controlId={controlId}
            control={control}
            controlData={controlData}
            handleChange={() => handleControlChange(control)}
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
            handleChange={() => handleControlChange(control)}
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
            handleChange={() => handleControlChange(control)}
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
            handleChange={(evt?: unknown) => handleChange(control, evt)}
            i18n={i18n}
          />
        )
      case 'custom':
        return (
          <React.Fragment key={controlId}>
            {renderCustom(control, controlId, templateYAML, handleCreateResource, controlProps)}
          </React.Fragment>
        )
    }
    return null
  }

  function setControlRef(control: TemplateControl, ref: HTMLDivElement | null) {
    control.ref = ref
  }

  function renderCustom(
    control: TemplateControl,
    controlId: string,
    templateYAML: unknown,
    handleCreateResource: () => void,
    controlProps: Record<string, unknown> | undefined
  ): React.ReactNode {
    const { i18n } = props
    const { component } = control as TemplateControl & { component: React.ReactElement }
    const custom = React.cloneElement(component, {
      control,
      i18n,
      controlId,
      handleChange: (evt?: unknown) => handleChange(control, evt),
      templateYAML,
      handleCreateResource,
      controlProps,
    })
    return (
      <React.Fragment>
        <div className="creation-view-controls-custom" ref={(ref) => setControlRef(control, ref)}>
          {custom}
        </div>
      </React.Fragment>
    )
  }

  function handleChange(control: TemplateControl, evt?: unknown) {
    void evt
    let updateName = false
    let { isCustomName } = props
    const { controlData, originalControlData, onChange } = props
    const { id: field, type, syncWith, syncedWith } = control

    if (onChange) {
      control.refresh = () => props.handleControlChange(control, controlData)
      onChange(control)
    }

    switch (type) {
      case 'text':
        isCustomName = field === 'name'
        break
      case 'multiselect':
        // if user was able to select something that automatically
        // generates the name, blow away the user name
        updateName = Boolean(!isCustomName && control.updateNamePrefix)
        break
    }

    // update name if spec changed
    if (updateName) {
      let cname: string
      const nname = controlData.find(({ id }) => id === 'name')
      const activeArr = control.active as string[]
      const map = control.availableMap as Record<string, { name: string }> | undefined
      if (nname) {
        if (activeArr?.length > 0 && map && control.updateNamePrefix) {
          cname = control.updateNamePrefix + map[activeArr[0]].name.replaceAll(/\W/g, '-')
        } else {
          cname = String(originalControlData.find(({ id }) => id === 'name')?.active ?? '')
        }
        nname.active = cname.toLowerCase()
      }
    }

    // syncing values
    if (syncWith && control.groupControlData) {
      // whatever is typed into this control, also put in other control
      const syncControl = control.groupControlData.find(({ id }) => id === syncWith)
      if (syncControl) {
        syncControl.active = `${control.active as string}${(syncControl.syncedSuffix as string) || ''}`
      }
    }
    if (syncedWith && control.groupControlData) {
      // if another control is synced with this control and
      // user is typing a value here directly, remove sync
      const syncedControl = control.groupControlData.find(({ id }) => id === syncedWith)
      delete control.syncedWith
      if (syncedControl) {
        delete syncedControl.syncWith
      }
    }
    props.handleControlChange(control, controlData, isCustomName)
    return field
  }

  function handleCardChange(control: TemplateControl, selection: string | null) {
    const { controlData, isCustomName } = props
    const { multiselect, newEditorMode } = control
    if (!newEditorMode) {
      if (!multiselect) {
        control.active = selection
      } else {
        const ac = control.active as string[] | undefined
        if (!ac) {
          control.active = [selection as string]
        } else {
          const inx = ac.indexOf(selection as string)
          if (inx === -1) {
            ac.push(selection as string)
          } else {
            ac.splice(inx, 1)
          }
        }
      }
      props.handleControlChange(control, controlData, creationViewRef.current, isCustomName)
    } else {
      control.active = []
      if (selection) {
        ;(control.active as string[]).push(selection)
      }
      props.handleNewEditorMode(control, controlData, creationViewRef.current, wizardRef.current)
    }
  }

  function handleControlChange(control: TemplateControl) {
    const { controlData, onChange } = props
    if (onChange) {
      control.refresh = () => props.handleControlChange(control, controlData)
      onChange(control)
    }
    props.handleControlChange(control, controlData)
  }

  function renderPortals(): React.ReactNode {
    const { showPortals } = props
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

  function renderNotifications(isForm?: boolean): React.ReactNode {
    const { notifications = [] } = props
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

  function renderDeleteGroupButton(control: TemplateControl, inx: number): React.ReactNode {
    const { controlData } = props
    const {
      prompts: { deletePrompt },
    } = control as TemplateControl & { prompts: { deletePrompt: string } }
    const handleGroupChange = () => {
      props.handleGroupChange(control, controlData, creationViewRef.current, inx)
    }
    return (
      <Button
        icon={<TrashIcon />}
        variant="plain"
        className="creation-view-controls-delete-button"
        tabIndex={0}
        title={deletePrompt}
        aria-label={deletePrompt}
        onClick={handleGroupChange}
        size="sm"
      />
    )
  }

  function renderAddGroupButton(control: TemplateControl): React.ReactNode {
    const { controlData } = props
    const {
      prompts: { addPrompt },
    } = control as TemplateControl & { prompts: { addPrompt: string } }
    const handleGroupChange = () => {
      props.handleGroupChange(control, controlData, creationViewRef.current)
    }

    return (
      <Button id={`add-${control.id}`} variant="link" onClick={handleGroupChange} icon={<PlusCircleIcon />} size="sm">
        {addPrompt}
      </Button>
    )
  }

  function isHidden(control: TemplateControl, controlData: TemplateControl[]) {
    const { hidden } = control
    return hidden === true || hidden === 'true' || (typeof hidden === 'function' && hidden(control, controlData))
  }

  const { controlData, showEditor } = props
  const controlClasses = classNames({
    'creation-view-controls': true,
    'pf-v6-c-form': true,
    showEditor,
  })
  return (
    <div className="creation-view-controls-container">{renderControlFormOrWizard(controlData, controlClasses)}</div>
  )
}
