/* Copyright Contributors to the Open Cluster Management project */
import {
  ActionGroup,
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  AlertGroup,
  Button,
  Checkbox,
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  DataList,
  DataListAction,
  DataListCell,
  DataListControl,
  DataListDragButton,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Drawer,
  DrawerColorVariant,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Flex,
  Form,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
  FormSection,
  Gallery,
  InputGroup,
  NumberInput,
  Page,
  PageSection,
  Popover,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Switch,
  Text,
  TextArea,
  TextContent,
  TextInput,
  Tile,
  Title,
  InputGroupItem,
  useWizardContext,
  WizardStep,
  Wizard,
  WizardFooterWrapper,
} from '@patternfly/react-core'
import { Select, SelectGroup, SelectOption, SelectOptionObject, SelectProps } from '@patternfly/react-core/deprecated'
import { ValidatedOptions } from '@patternfly/react-core/dist/js/helpers/constants'
import {
  EditIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  HelpIcon,
  PasteIcon,
  PlusCircleIcon,
  TimesCircleIcon,
  TrashIcon,
} from '@patternfly/react-icons'
import useResizeObserver from '@react-hook/resize-observer'
import { Fragment, ReactNode, useCallback, useContext, useRef, useState } from 'react'
import { TFunction } from 'react-i18next'
import YAML from 'yaml'
import { useTranslation } from '../lib/acm-i18next'
import { AcmPageHeader } from '../ui-components'
import {
  FormData,
  FormDataOrderedInput,
  Input,
  InputBase,
  Section,
  SectionGroup,
  SelectOptionInput,
} from './AcmFormData'
import { SyncEditor } from './SyncEditor/SyncEditor'
import { LostChangesContext, LostChangesPrompt } from './LostChanges'
import { AcmHelperText } from '../ui-components/AcmHelperText/AcmHelperText'

export interface AcmDataFormProps {
  formData: FormData
  editorTitle?: string
  secrets?: (string | string[])[]
  immutables?: (string | string[])[]
  schema?: any
  mode?: 'form' | 'wizard' | 'details'
  isHorizontal?: boolean
  edit?: () => void
  globalWizardAlert?: ReactNode
  hideYaml?: boolean
  isModalWizard?: boolean
}

export function generalValidationMessage(t: TFunction) {
  return t('You must fix the issues with fields before you can proceed.')
}

export function requiredValidationMessage(t: TFunction) {
  return t('You must fill out all required fields before you can proceed.')
}

const minWizardSize = 1000
const defaultPanelSize = 600

export function AcmDataFormPage(props: AcmDataFormProps): JSX.Element {
  const pageRef = useRef(null)
  const { t } = useTranslation()

  const { editorTitle, schema, secrets, immutables, formData, globalWizardAlert, hideYaml, isModalWizard } = props
  const [showFormErrors, setShowFormErrors] = useState(false)

  const mode = props.mode ?? 'form'
  const isHorizontal = props.isHorizontal ?? false
  const [drawerExpanded, setDrawerExpanded] = useState(localStorage.getItem('yaml') === 'true')
  const [drawerMaxSize, setDrawerMaxSize] = useState<string | undefined>()
  const [copyHint, setCopyHint] = useState<ReactNode>(
    <span style={{ wordBreak: 'keep-all' }}>{t('Copy to clipboard')}</span>
  )

  const resources = formData.stateToData()

  useResizeObserver(pageRef, (entry) => {
    const inline = drawerExpanded && entry.contentRect.width > minWizardSize + defaultPanelSize
    setDrawerMaxSize(inline ? `${Math.round((entry.contentRect.width * 2) / 3)}px` : undefined)
  })

  const drawerContent = () => {
    return (
      <Drawer isExpanded={drawerExpanded} isInline={true}>
        <DrawerContent
          panelContent={
            hideYaml ? (
              ''
            ) : (
              <DrawerPanelContent
                isResizable={true}
                defaultSize="600px"
                maxSize={drawerMaxSize}
                minSize="400px"
                colorVariant={DrawerColorVariant.light200}
              >
                {editorTitle ? (
                  <SyncEditor
                    variant="toolbar"
                    id="code-content"
                    editorTitle={editorTitle}
                    readonly={mode === 'details'}
                    resources={resources}
                    schema={schema}
                    immutables={immutables}
                    secrets={secrets}
                    syncs={formData.stateToSyncs && formData.stateToSyncs()}
                    onClose={(): void => {
                      setDrawerExpanded(false)
                    }}
                    onEditorChange={(changes: { resources: any[] }): void => {
                      formData.customData = changes?.resources
                    }}
                  />
                ) : (
                  <CodeBlock
                    actions={
                      <CodeBlockAction>
                        <ClipboardCopyButton
                          id="copy-button"
                          textId="code-content"
                          aria-label={t('Copy to clipboard')}
                          onClick={() => {
                            navigator.clipboard.writeText(YAML.stringify(formData.stateToData()))
                            setCopyHint(
                              <span style={{ wordBreak: 'keep-all' }}>{t('Successfully copied to clipboard!')}</span>
                            )
                            setTimeout(() => {
                              setCopyHint(<span style={{ wordBreak: 'keep-all' }}>{t('Copy to clipboard')}</span>)
                            }, 800)
                          }}
                          exitDelay={600}
                          variant="plain"
                        >
                          {copyHint}
                        </ClipboardCopyButton>
                      </CodeBlockAction>
                    }
                  >
                    <CodeBlockCode id="code-content" style={{ fontSize: 'small' }}>
                      {YAML.stringify(formData.stateToData())}
                    </CodeBlockCode>
                  </CodeBlock>
                )}
              </DrawerPanelContent>
            )
          }
        >
          <DrawerContentBody>
            {mode === 'wizard' ? (
              <PageSection isFilled type="wizard" style={{ height: '100%' }}>
                <AcmDataForm
                  {...props}
                  mode={mode}
                  showFormErrors={showFormErrors}
                  setShowFormErrors={setShowFormErrors}
                  isHorizontal={isHorizontal}
                  globalWizardAlert={globalWizardAlert}
                  isModalWizard={isModalWizard}
                />
              </PageSection>
            ) : (
              <PageSection variant="light" isFilled>
                <AcmDataForm
                  {...props}
                  mode={mode}
                  showFormErrors={showFormErrors}
                  setShowFormErrors={setShowFormErrors}
                  isHorizontal={isHorizontal}
                />
              </PageSection>
            )}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div ref={pageRef} style={{ height: hideYaml ? '40em' : '100%' }}>
      {isModalWizard ? (
        drawerContent()
      ) : (
        <Page
          additionalGroupedContent={
            <Fragment>
              <AcmPageHeader
                title={formData.title}
                titleTooltip={formData.titleTooltip}
                description={formData.description}
                breadcrumb={formData.breadcrumb}
                actions={
                  <ActionList>
                    {mode === 'details' && props.edit !== undefined && (
                      <ActionListItem>
                        <Button onClick={props.edit}>{t('Edit')}</Button>
                      </ActionListItem>
                    )}
                  </ActionList>
                }
                switches={
                  hideYaml ? undefined : (
                    <Fragment>
                      {(editorTitle || process.env.NODE_ENV === 'development') && (
                        <Switch
                          label="YAML"
                          isChecked={drawerExpanded}
                          onChange={() => {
                            localStorage.setItem('yaml', (!drawerExpanded).toString())
                            setDrawerExpanded(!drawerExpanded)
                          }}
                        />
                      )}
                    </Fragment>
                  )
                }
              />
              {showFormErrors && mode === 'form' && formHasErrors(t, formData) && (
                <PageSection variant="light" style={{ paddingTop: 0 }}>
                  <AlertGroup>
                    {formHasRequiredErrors(formData) ? (
                      <Alert isInline variant="danger" title={requiredValidationMessage(t)} />
                    ) : (
                      <Alert isInline variant="danger" title={generalValidationMessage(t)} />
                    )}
                  </AlertGroup>
                </PageSection>
              )}
            </Fragment>
          }
          groupProps={{ stickyOnBreakpoint: { default: 'top' } }}
        >
          {drawerContent()}
        </Page>
      )}
    </div>
  )
}

export function AcmDataForm(
  props: AcmDataFormProps & {
    showFormErrors: boolean
    setShowFormErrors: (showFormErrors: boolean) => void
    globalWizardAlert?: ReactNode
    isModalWizard?: boolean
  }
): JSX.Element {
  const { formData, isHorizontal, globalWizardAlert, showFormErrors, setShowFormErrors, isModalWizard, mode } = props
  if (mode === 'details') {
    return (
      <Form>
        <AcmDataFormDetails formData={formData} />
      </Form>
    )
  } else {
    return (
      <>
        <LostChangesPrompt isNested={isModalWizard} data={formData.stateToData()} />
        {mode === 'wizard' ? (
          <AcmDataFormWizard
            formData={formData}
            isHorizontal={isHorizontal ?? false}
            showFormErrors={showFormErrors}
            setShowFormErrors={setShowFormErrors}
            globalWizardAlert={globalWizardAlert}
            isModalWizard={isModalWizard}
          />
        ) : (
          <AcmDataFormDefault
            formData={formData}
            isHorizontal={isHorizontal}
            showFormErrors={showFormErrors}
            setShowFormErrors={setShowFormErrors}
          />
        )}
      </>
    )
  }
}

export function AcmDataFormDefault(props: {
  formData: FormData
  isHorizontal?: boolean
  showFormErrors: boolean
  setShowFormErrors: (showFormErrors: boolean) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formData, isHorizontal, showFormErrors, setShowFormErrors } = props
  const [submitText, setSubmitText] = useState(formData.submitText)
  const [submitError, setSubmitError] = useState('')
  const isSubmitting = submitText !== formData.submitText
  const { cancelForm } = useContext(LostChangesContext)

  const cancel = useCallback(() => {
    cancelForm()
    formData.cancel()
  }, [cancelForm, formData])

  return (
    <Form isHorizontal={isHorizontal}>
      {formData.sections.map((section) => {
        if (sectionHidden(section)) return <Fragment key={`hidden-${section.title}`} />
        if (section.type === 'Section') {
          return (
            <FormSection key={section.title}>
              <Title headingLevel="h2">{section.title}</Title>
              <AcmDataFormInputs inputs={section.inputs} showFormErrors={showFormErrors} isReadOnly={isSubmitting} />
            </FormSection>
          )
        }
        return (
          <FormSection key={section.title}>
            <Title headingLevel="h2">{section.title}</Title>
            {section.sections?.map((group) => {
              if (sectionHidden(group)) return <Fragment key={group.title} />
              return (
                <FormFieldGroupExpandable
                  key={group.title}
                  header={
                    <FormFieldGroupHeader
                      titleText={{ text: group.title, id: group.title }}
                      titleDescription={group.description}
                    />
                  }
                >
                  <AcmDataFormInputs inputs={group.inputs} showFormErrors={showFormErrors} isReadOnly={isSubmitting} />
                </FormFieldGroupExpandable>
              )
            })}
          </FormSection>
        )
      })}

      <Stack>
        <StackItem>
          {submitError && <Alert isInline variant="danger" title={submitError} />}

          <ActionGroup>
            <Divider />
            <ActionList>
              <ActionListGroup>
                <ActionListItem>
                  <Button
                    onClick={() => {
                      setShowFormErrors(true)
                      if (!formHasErrors(t, formData)) {
                        try {
                          const result = formData.submit()
                          if ((result as unknown) instanceof Promise) {
                            setSubmitText(formData.submittingText)
                            ;(result as unknown as Promise<void>).catch((err) => {
                              if (err instanceof Error) setSubmitError(err.message)
                              setSubmitText(formData.submitText)
                            })
                          }
                        } catch (err) {
                          if (err instanceof Error) setSubmitError(err.message)
                        }
                      }
                    }}
                    variant="primary"
                    isDisabled={(showFormErrors && formHasErrors(t, formData)) || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    {submitText}
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button variant="secondary" onClick={cancel} isDisabled={isSubmitting}>
                    {formData.cancelLabel}
                  </Button>
                </ActionListItem>
              </ActionListGroup>
            </ActionList>
          </ActionGroup>
        </StackItem>
      </Stack>
    </Form>
  )
}

export function AcmDataFormWizard(props: {
  formData: FormData
  isHorizontal: boolean
  globalWizardAlert?: ReactNode
  showFormErrors: boolean
  isModalWizard?: boolean
  setShowFormErrors: (showFormErrors: boolean) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formData, isHorizontal, globalWizardAlert, showFormErrors, setShowFormErrors, isModalWizard } = props
  const [showSectionErrors, setShowSectionErrors] = useState<Record<string, boolean>>({})
  const [submitText, setSubmitText] = useState(formData.submitText)
  const [submitError, setSubmitError] = useState('')
  const isSubmitting = submitText !== formData.submitText
  const { cancelForm } = useContext(LostChangesContext)

  const cancel = () => {
    cancelForm()
    formData.cancel()
  }

  function createStep(section: Section | SectionGroup) {
    if (sectionHidden(section)) return undefined
    const hasError = showFormErrors && sectionHasErrors(t, section)

    return {
      id: section.title,
      name: (
        <Split>
          <SplitItem isFilled>{section.title}</SplitItem>
          {hasError && section.type === 'Section' && (
            <span style={{ paddingLeft: '8px' }}>
              <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />
            </span>
          )}
        </Split>
      ),
      component: section.type === 'Section' && (
        <Form isHorizontal={isHorizontal}>
          {globalWizardAlert && <AlertGroup>{globalWizardAlert}</AlertGroup>}
          {(showFormErrors || showSectionErrors[section.title]) && hasError && (
            <AlertGroup>
              {sectionHasRequiredErrors(section) ? (
                <Alert isInline variant="danger" title={requiredValidationMessage(t)} />
              ) : (
                <Alert isInline variant="danger" title={generalValidationMessage(t)} />
              )}
            </AlertGroup>
          )}
          {section.alerts && <AlertGroup>{section.alerts}</AlertGroup>}
          <Title headingLevel="h2">{section.wizardTitle ?? section.title}</Title>
          {section.description && (
            <TextContent>
              <Text component="small">{section.description}</Text>
            </TextContent>
          )}
          <AcmDataFormInputs
            inputs={section.inputs}
            showFormErrors={showFormErrors || showSectionErrors[section.title]}
            isReadOnly={isSubmitting}
            mode="wizard"
          />
        </Form>
      ),
      steps:
        section.type === 'SectionGroup'
          ? section.sections?.map(createStep).filter((step) => step !== undefined)
          : undefined,
    }
  }

  const steps = formData.sections.map(createStep).filter((step) => step !== undefined)

  steps.push({
    id: 'review',
    name: t('Review'),
    component: (
      <Form>
        {showFormErrors && formHasErrors(t, formData) && (
          <AlertGroup>
            {formHasRequiredErrors(formData) ? (
              <Alert isInline variant="danger" title={requiredValidationMessage(t)} />
            ) : (
              <Alert isInline variant="danger" title={generalValidationMessage(t)} />
            )}
          </AlertGroup>
        )}
        <AcmDataFormDetails formData={formData} wizardSummary={true} />
      </Form>
    ),
    canJumpTo: !isSubmitting,
  })

  const Footer = (activeStep, goToNextStep, goToPrevStep, close) => {
    let section: Section | undefined
    let firstSection: Section | undefined
    for (const formSection of formData.sections) {
      switch (formSection.type) {
        case 'Section':
          if (formSection.title === activeStep?.id) section = formSection
          if (!firstSection) firstSection = formSection
          break
        case 'SectionGroup':
          for (const group of formSection.sections ?? []) {
            if (group.title === activeStep?.id) {
              section = group
            }
            if (!firstSection) firstSection = group
          }
          break
      }
      if (section) break
    }
    if (section) {
      return (
        <WizardFooterWrapper>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowSectionErrors((showSectionErrors) => {
                      if (section) {
                        if (!showSectionErrors[section.title]) {
                          return { ...showSectionErrors, ...{ [section.title]: true } }
                        }
                      }
                      return showSectionErrors
                    })
                    if (sectionHasErrors(t, section)) return
                    goToNextStep()
                  }}
                  isDisabled={
                    ((showFormErrors || showSectionErrors[section.title]) && sectionHasErrors(t, section)) ||
                    isSubmitting
                  }
                >
                  {formData.nextLabel}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button
                  variant="secondary"
                  onClick={activeStep?.id === firstSection?.title && formData.back ? formData.back : goToPrevStep}
                  isDisabled={formData.back ? false : activeStep?.id === firstSection?.title || isSubmitting}
                >
                  {formData.backLabel}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant="link" onClick={close} isDisabled={isSubmitting}>
                  {formData.cancelLabel}
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </WizardFooterWrapper>
      )
    }

    setShowFormErrors(true)

    return (
      <Stack hasGutter style={{ width: '100%' }}>
        {submitError && <Alert isInline variant="danger" title={submitError} />}
        <ActionGroup>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button
                  onClick={() => {
                    if (!formHasErrors(t, formData)) {
                      try {
                        const result = formData.submit()
                        if ((result as unknown) instanceof Promise) {
                          setSubmitText(formData.submittingText)
                          ;(result as unknown as Promise<void>).catch((err) => {
                            if (err instanceof Error) setSubmitError(err.message)
                            setSubmitText(formData.submitText)
                          })
                        }
                      } catch (err) {
                        if (err instanceof Error) setSubmitError(err.message)
                      }
                    }
                  }}
                  variant="primary"
                  isDisabled={(showFormErrors && formHasErrors(t, formData)) || isSubmitting}
                  isLoading={isSubmitting}
                >
                  {submitText}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant="secondary" onClick={goToPrevStep} isDisabled={isSubmitting}>
                  {formData.backLabel}
                </Button>
              </ActionListItem>
            </ActionListGroup>
            <ActionListGroup>
              <ActionListItem>
                <Button variant="link" onClick={cancel} isDisabled={isSubmitting}>
                  {formData.cancelLabel}
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </ActionGroup>
      </Stack>
    )
  }

  return (
    <Fragment>
      {isModalWizard ? (
        <Wizard title={formData.title} footer={Footer} onClose={cancel}>
          {steps.map(({ id, name, content }) => {
            ;<WizardStep id={id} name={name}>
              {content}
            </WizardStep>
          })}
        </Wizard>
      ) : (
        <Wizard footer={Footer} onClose={cancel}>
          {steps.map(({ id, name, content }) => {
            ;<WizardStep id={id} name={name}>
              {content}
            </WizardStep>
          })}
        </Wizard>
      )}
    </Fragment>
  )
}

export function AcmDataFormDetails(props: { formData: FormData; wizardSummary?: boolean }): JSX.Element {
  const { formData, wizardSummary } = props
  let i = 0
  return (
    <Fragment>
      {wizardSummary && formData.reviewTitle !== undefined && (
        <Fragment>
          <Title headingLevel="h2">{formData.reviewTitle}</Title>
          {formData.reviewDescription && <Text component="p">{formData.reviewDescription}</Text>}
        </Fragment>
      )}
      {/* <Divider /> */}
      {formData.sections.map((formSection) => {
        if (!sectionHasValue(formSection)) return <Fragment key={`novalue-${formSection.title}`} />
        if (sectionHidden(formSection)) return <Fragment key={`hidden-${formSection.title}`} />
        i++
        return (
          <FormSection key={formSection.title}>
            {/* {index !== 0 && <Divider />} */}

            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              {wizardSummary && (
                <span
                  style={{
                    backgroundColor: 'var(--pf-v5-c-wizard__nav-link--before--BackgroundColor)',
                    borderRadius: 'var(--pf-v5-c-wizard__nav-link--before--BorderRadius)',
                    width: 'var(--pf-v5-c-wizard__nav-link--before--Width)',
                    height: 'var(--pf-v5-c-wizard__nav-link--before--Height)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--pf-v5-c-wizard__nav-link--before--FontSize)',
                  }}
                >
                  {i.toString()}
                </span>
              )}
              <Title headingLevel="h3">{formSection.title}</Title>
            </Flex>

            {formSection.type === 'Section'
              ? anyInputHasValue(formSection.inputs) && (
                  <DescriptionList
                    columnModifier={{ default: '1Col' }}
                    isHorizontal={true}
                    style={{ paddingLeft: wizardSummary ? '64px' : '32px' }}
                  >
                    {formSection.inputs &&
                      formSection.inputs.map((input, index) => (
                        <AcmInputDescription input={input} key={`formSection-${input.id ?? index}`} />
                      ))}
                  </DescriptionList>
                )
              : formSection.sections && (
                  <Fragment>
                    {formSection.sections.map((section) => {
                      if (sectionHidden(section)) return <Fragment key={section.title} />
                      if (!anyInputHasValue(section.inputs)) return <Fragment key={section.title} />
                      return (
                        <div key={section.title} style={{ paddingLeft: wizardSummary ? '64px' : '32px' }}>
                          <Title headingLevel="h4">{section.title}</Title>
                          <DescriptionList
                            columnModifier={{ default: '1Col' }}
                            isHorizontal={true}
                            style={{
                              paddingLeft: wizardSummary ? '32px' : '0px',
                              paddingTop: '16px',
                            }}
                          >
                            {section.inputs &&
                              section.inputs.map((input, index) => (
                                <AcmInputDescription input={input} key={`section-${input.id ?? index}`} />
                              ))}
                          </DescriptionList>
                        </div>
                      )
                    })}
                  </Fragment>
                )}
          </FormSection>
        )
      })}
    </Fragment>
  )
}

function AcmInputDescription(props: { input: Input }): JSX.Element {
  const [showSecrets, setShowSecrets] = useState(false)
  const { input } = props
  if (input.isHidden) return <Fragment />
  if (!inputHasValue(input)) return <Fragment />
  switch (input.type) {
    case 'Text':
    case 'TextArea':
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription style={{ whiteSpace: 'pre-wrap' }}>
            <Split>
              <SplitItem isFilled>
                {input.isSecret && !showSecrets
                  ? '****************'
                  : input.value?.split('\n').map((line) => <div key={`input-value-line-${line}`}>{line}</div>)}
              </SplitItem>
              {input.isSecret && (
                <Stack>
                  <Button variant="plain" style={{ marginTop: '-8px' }} onClick={() => setShowSecrets(!showSecrets)}>
                    {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
                  </Button>
                  <StackItem isFilled />
                </Stack>
              )}
            </Split>
          </DescriptionListDescription>
        </DescriptionListGroup>
      )
    case 'Alert':
    case 'TextNumber':
    case 'Number':
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>{input.value}</DescriptionListDescription>
        </DescriptionListGroup>
      )
    case 'Select':
    case 'Tiles': {
      const selectedOption = input.options.find((option) => option.value === input.value)
      if (!selectedOption)
        return (
          <DescriptionListGroup key={input.label}>
            <DescriptionListTerm>{input.label}</DescriptionListTerm>
            <DescriptionListDescription>{input.value}</DescriptionListDescription>
          </DescriptionListGroup>
        )
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>{selectedOption.text ?? selectedOption.value}</DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
    case 'Checkbox': {
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>{input.value ? 'True' : 'False'}</DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
    case 'GroupedSelect':
    case 'GroupedTiles': {
      let selectedOption: SelectOptionInput | undefined
      for (const group of input.groups) {
        selectedOption = group.options.find((option) => option.value === input.value)
        if (selectedOption !== undefined) break
      }
      if (!selectedOption) return <Fragment />
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>{selectedOption.text ?? selectedOption.value}</DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
    case 'Multiselect': {
      const selectedOptions: SelectOptionInput[] = []
      for (const option of input.options) {
        if (input.value.includes(option.value)) {
          selectedOptions.push(option)
        }
      }
      if (selectedOptions.length === 0) return <Fragment />
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>
            {selectedOptions.map((option) => option.text ?? option.value).join(', ')}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
    case 'GroupedMultiselect': {
      const selectedOptions: SelectOptionInput[] = []
      for (const group of input.groups) {
        for (const option of group.options) {
          if (input.value.includes(option.value)) {
            selectedOptions.push(option)
          }
        }
      }
      if (selectedOptions.length === 0) return <Fragment />
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>
            {selectedOptions.map((option) => option.text ?? option.value).join(', ')}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
    case 'OrderedItems': {
      if (input.value.length === 0) return <Fragment />
      return (
        <DescriptionListGroup key={input.label}>
          <DescriptionListTerm>{input.label}</DescriptionListTerm>
          <DescriptionListDescription>
            <Stack>
              {input.value.map((value, index) => (
                <div key={input.keyFn(value, index)}>{input.summaryFn(value)}</div>
              ))}
            </Stack>
          </DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
  }
}

export function AcmDataFormInputs(props: {
  inputs?: Input[]
  showFormErrors?: boolean
  isReadOnly: boolean
  mode?: 'form' | 'wizard' | 'details'
}): JSX.Element {
  const { inputs, showFormErrors, isReadOnly } = props
  const { t } = useTranslation()
  return (
    <Fragment>
      {inputs?.map((input) => {
        const error: string | undefined = inputError(t, input)
        const validated = (showFormErrors || input.validate) && error !== undefined ? 'error' : undefined
        return (
          <Fragment key={input.id}>
            {!input.isHidden && (
              <FormGroup
                id={`${input.id}-form-group`}
                fieldId={input.id}
                label={input?.title ?? input.label}
                isRequired={input.isRequired}
                labelIcon={
                  <LabelHelp id={input.id} labelHelp={input.labelHelp} labelHelpTitle={input.labelHelpTitle} />
                }
              >
                <AcmDataFormInput input={input} validated={validated} isReadOnly={isReadOnly} />
                <AcmHelperText
                  controlId={input.id}
                  helperText={input.helperText}
                  validated={validated}
                  error={error}
                  prompt={input.prompt}
                />
              </FormGroup>
            )}
          </Fragment>
        )
      })}
    </Fragment>
  )
}

export function AcmDataFormInput(props: { input: Input; validated?: 'error'; isReadOnly: boolean }): JSX.Element {
  const { input, validated, isReadOnly } = props
  const [showSecrets, setShowSecrets] = useState(input.type === 'TextArea' && input.value === '')

  switch (input.type) {
    case 'Text': {
      const value = input.value
      const { onChange, isHidden, isSecret, labelHelp, validation, ...textInputProps } = input
      return (
        <InputGroup>
          <InputGroupItem isFill>
            <TextInput
              {...textInputProps}
              onChange={(_event, value) => onChange(value)}
              validated={validated}
              spellCheck="false"
              type={!isSecret || showSecrets ? 'text' : 'password'}
              readOnlyVariant={isReadOnly ? 'default' : undefined}
            />
          </InputGroupItem>
          {value === '' ? (
            <PasteInputButton setValue={input.onChange} setShowSecrets={setShowSecrets} />
          ) : (
            <Fragment>
              {isSecret && <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />}
              {!isReadOnly && !input.isDisabled && <ClearInputButton onClick={() => input.onChange('')} />}
            </Fragment>
          )}
        </InputGroup>
      )
    }
    case 'TextNumber': {
      const { onChange, ...inputProps } = input
      return (
        <InputGroup>
          <InputGroupItem isFill>
            <TextInput
              {...inputProps}
              validated={validated}
              type={'number'}
              onChange={(_event, value) => onChange(Number(value))}
              readOnlyVariant={isReadOnly ? 'default' : undefined}
            />
          </InputGroupItem>
        </InputGroup>
      )
    }
    case 'TextArea': {
      const hideSecretInput = input.value !== '' && input.isSecret === true && !showSecrets
      const { onChange, ...inputProps } = input
      return (
        <InputGroup>
          {hideSecretInput ? (
            <TextInput
              {...inputProps}
              onChange={(_event, value) => onChange(value)}
              value={'**************'}
              validated={validated}
              type={'password'}
              readOnlyVariant={isReadOnly ? 'default' : undefined}
            />
          ) : (
            <TextArea
              {...inputProps}
              onChange={(_event, value) => onChange(value)}
              validated={validated}
              spellCheck="false"
              resizeOrientation="vertical"
              autoResize={true}
              readOnlyVariant={isReadOnly ? 'default' : undefined}
            />
          )}

          {input.value === '' ? (
            <PasteInputButton setValue={input.onChange} setShowSecrets={setShowSecrets} />
          ) : (
            <Fragment>
              {input.isSecret && <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />}
              {!isReadOnly && !input.isDisabled && <ClearInputButton onClick={() => input.onChange('')} />}
            </Fragment>
          )}
        </InputGroup>
      )
    }
    case 'Checkbox': {
      const { onChange, value, ...inputProps } = input
      return <Checkbox {...inputProps} onChange={(_event, value) => onChange(value)} isChecked={value} />
    }

    case 'Select':
    case 'GroupedSelect':
    case 'Multiselect':
    case 'GroupedMultiselect': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { onChange, placeholder, validate, validation, isRequired, ...inputProps } = input
      const onSelect = (_event: unknown, selection: string | SelectOptionObject) => {
        switch (input.type) {
          case 'Select':
          case 'GroupedSelect':
            input.onChange(selection as string)
            break
          case 'Multiselect':
          case 'GroupedMultiselect':
            if (!input.value.includes(selection as string)) {
              input.onChange([...input.value, ...[selection as string]])
            } else {
              input.onChange([...input.value.filter((v) => v !== (selection as string))])
            }
            break
        }
      }
      let onClear: (() => void) | undefined = undefined
      if (!isReadOnly && !input.isDisabled) {
        onClear = () => {
          switch (input.type) {
            case 'Select':
            case 'GroupedSelect':
              input.onChange('')
              break
            case 'Multiselect':
            case 'GroupedMultiselect':
              input.onChange([])
              break
          }
        }
      }
      let selections: string | SelectOptionObject | (string | SelectOptionObject)[] = input.value
      switch (input.type) {
        case 'Select':
        case 'GroupedSelect': {
          let selectedOption: SelectOptionInput | undefined
          switch (input.type) {
            case 'Select':
              selectedOption = input.options.find((option) => option.value === input.value)
              break
            case 'GroupedSelect':
              for (const group of input.groups) {
                selectedOption = group.options.find((option) => option.value === input.value)
                if (selectedOption !== undefined) break
              }
              break
          }
          if (selectedOption?.icon) {
            selections = {
              toString: () => {
                return (
                  <Fragment>
                    <span style={{ paddingRight: '8px' }}>{selectedOption?.icon}</span>
                    {selectedOption?.text}
                  </Fragment>
                ) as unknown as string
              },
              compareTo: (option: any) => {
                return option?.value === selectedOption?.value
              },
            }
          }
          break
        }
      }
      let hasIcons = false
      switch (input.type) {
        case 'Select':
        case 'Multiselect':
          for (const option of input.options) {
            if (option.icon) {
              hasIcons = true
              break
            }
          }
          break
        case 'GroupedSelect':
        case 'GroupedMultiselect':
          for (const group of input.groups) {
            for (const option of group.options) {
              if (option.icon) {
                hasIcons = true
                break
              }
            }
            if (hasIcons) {
              break
            }
          }
          break
      }
      let variant = input.variant
      if (!variant) {
        switch (input.type) {
          case 'Select':
          case 'GroupedSelect':
            variant = hasIcons ? 'single' : 'typeahead'
            break
          case 'Multiselect':
          case 'GroupedMultiselect':
            variant = 'typeaheadmulti'
            break
        }
      }
      return (
        <SelectWithToggle
          {...inputProps}
          toggleId={`${input.id}-input-toggle`}
          selections={selections}
          onSelect={onSelect}
          onClear={onClear}
          isCreatable={false}
          isDisabled={isReadOnly || input.isDisabled}
          validated={validated}
          autoClose={input.type === 'Select' || input.type === 'GroupedSelect'}
          isGrouped={input.type === 'GroupedSelect' || input.type === 'GroupedMultiselect'}
          variant={variant}
          placeholderText={input.placeholder}
        >
          {input.type === 'Select' || input.type === 'Multiselect'
            ? input.options.map((option) => {
                return (
                  <SelectOption key={option.value} value={option.value} description={option.description}>
                    {option.icon !== undefined && <span style={{ paddingRight: '8px' }}>{option.icon}</span>}
                    {option.text ?? option.value}
                  </SelectOption>
                )
              })
            : input.groups.map((group, index) => (
                <SelectGroup key={index} label={group.group}>
                  {group.options.map((option) => {
                    return (
                      <SelectOption key={option.value} value={option.value} description={option.description}>
                        {option.icon !== undefined && <span style={{ paddingRight: '8px' }}>{option.icon}</span>}
                        {option.text ?? option.value}
                      </SelectOption>
                    )
                  })}
                </SelectGroup>
              ))}
        </SelectWithToggle>
      )
    }

    case 'Tiles':
      return <SelectOptionsGallery input={input} options={input.options} />

    case 'GroupedTiles':
      return (
        <Stack hasGutter>
          {input.groups.map((group) => (
            <Stack hasGutter key={`GroupedTiles-input-groups-${group.group}`}>
              <Title headingLevel="h4">{group.group}</Title>
              <SelectOptionsGallery input={input} options={group.options} />
            </Stack>
          ))}
        </Stack>
      )

    case 'Number': {
      const { onChange, ...inputProps } = input
      return (
        <NumberInput
          {...inputProps}
          onChange={(event) => onChange(Number((event.target as any).value))}
          onPlus={() => {
            const step = input.step ?? 1
            input.onChange(input.value + step)
          }}
          onMinus={() => {
            const step = input.step ?? 1
            input.onChange(input.value - step)
          }}
          // validated={validated} TODO
          isDisabled={isReadOnly}
        />
      )
    }

    case 'OrderedItems': {
      return <OrderedItemsInput input={input} validated={validated} isReadOnly={isReadOnly} />
    }

    case 'Alert': {
      return (
        <Alert isInline variant={input.variant} title={input.labelHelpTitle}>
          {input.reactNode}
        </Alert>
      )
    }
  }
}

function sectionHasValue(section: Section | SectionGroup) {
  if (!section) return false
  switch (section.type) {
    case 'Section':
      if (anyInputHasValue(section.inputs)) return true
      break
    case 'SectionGroup':
      if (section.sections) {
        for (const group of section.sections) {
          if (sectionHasValue(group)) return true
        }
      }
      break
  }
  return false
}

function anyInputHasValue(inputs?: Input[]) {
  if (!inputs) return false
  for (const input of inputs) {
    if (inputHasValue(input)) {
      return true
    }
  }
  return false
}

function formHasErrors(t: TFunction, formData: FormData) {
  for (const section of formData.sections) {
    if (sectionHasErrors(t, section)) return true
  }
  return false
}

function sectionHasErrors(t: TFunction, section?: SectionGroup | Section) {
  if (!section) return false
  switch (section.type) {
    case 'Section':
      if (inputsHaveErrors(t, section.inputs)) return true
      break
    case 'SectionGroup':
      if (section.sections) {
        for (const group of section.sections) {
          if (sectionHasErrors(t, group)) return true
        }
      }
      break
  }
  return false
}

function formHasRequiredErrors(formData: FormData) {
  for (const section of formData.sections) {
    if (sectionHasRequiredErrors(section)) return true
  }
  return false
}

function sectionHasRequiredErrors(formSection?: Section | SectionGroup) {
  if (!formSection) return false
  switch (formSection.type) {
    case 'Section':
      if (inputsHaveRequiredErrors(formSection.inputs)) return true
      break
    case 'SectionGroup':
      if (formSection.sections) {
        for (const group of formSection.sections) {
          if (sectionHasRequiredErrors(group)) return true
        }
      }
      break
  }
  return false
}

function inputsHaveRequiredErrors(inputs?: Input[]) {
  if (!inputs) return false
  for (const input of inputs) {
    if (inputHasRequiredError(input)) return true
  }
  return false
}

function inputHasRequiredError(input: Input) {
  if (input.isHidden) return false
  if (input.isRequired && !inputHasValue(input)) return true
  return false
}

function inputsHaveErrors(t: TFunction, inputs?: Input[]) {
  if (!inputs) return false
  for (const input of inputs) {
    if (inputError(t, input)) return true
  }
  return false
}

function inputError(t: TFunction, input: Input): string | undefined {
  if (input.isHidden) return undefined
  if (inputHasRequiredError(input)) return t('This is a required field.')
  return input.validation ? input.validation(input.value as never) : undefined
}

function inputHasValue(input: Input): boolean {
  switch (input.type) {
    case 'Multiselect':
    case 'GroupedMultiselect':
    case 'OrderedItems':
      return input.value.length !== 0
    default:
      return input.value !== '' && input.value !== 0
  }
}

function sectionHidden(section?: Section | SectionGroup): boolean {
  if (!section) return false
  switch (section.type) {
    case 'Section':
      return inputsHidden(section.inputs)
    case 'SectionGroup':
      if (section.sections) {
        let hidden = true
        for (const group of section.sections) {
          if (!sectionHidden(group)) hidden = false
        }
        return hidden
      }
      break
  }
  return true
}

function inputsHidden(inputs?: Input[]): boolean {
  if (!inputs) return true
  for (const input of inputs) {
    if (!input.isHidden) return false
  }
  return true
}

type selectWithToggleProps = Omit<SelectProps, 'onToggle'> & { autoClose: boolean }
function SelectWithToggle(props: selectWithToggleProps): JSX.Element {
  // TODO support isReadOnly
  const { validated, autoClose: closeOnSelect } = props
  const [open, setOpen] = useState(false)
  const { autoClose, ...selectProps } = props
  const { t } = useTranslation()
  return (
    <Select
      {...selectProps}
      isOpen={open}
      onToggle={() => setOpen(!open)}
      onSelect={(e, v) => {
        props.onSelect?.(e, v)
        if (closeOnSelect) setOpen(false)
      }}
      aria-invalid={validated === ValidatedOptions.error}
      noResultsFoundText={t('No results found')}
    >
      {props.children}
    </Select>
  )
}

function LabelHelp(props: { id: string; labelHelp?: string; labelHelpTitle?: string }): JSX.Element {
  return props.labelHelp ? (
    <Popover id={`${props.id}-label-help-popover`} headerContent={props.labelHelpTitle} bodyContent={props.labelHelp}>
      <Button
        variant="plain"
        id={`${props.id}-label-help-button`}
        aria-label="More info"
        onClick={(e) => e.preventDefault()}
        className="pf-v5-c-form__group-label-help"
        style={{ ['--pf-v5-c-form__group-label-help--TranslateY' as any]: 0 }}
        icon={<HelpIcon />}
      />
    </Popover>
  ) : (
    <Fragment />
  )
}

function SelectOptionsGallery(props: { input: InputBase<string>; options: SelectOptionInput[] }) {
  const { input, options } = props
  return (
    <Gallery hasGutter>
      {options.map((option, index) => (
        <Tile
          {...option}
          key={index}
          title={option.text ?? option.value}
          isStacked
          isSelected={input.value === option.value}
          onClick={() => input.onChange(option.value)}
          isDisabled={option.value !== input.value && input.isDisabled}
          isDisplayLarge
          onKeyPress={(event) => {
            if (event.key === 'Enter') input.onChange(option.value)
          }}
        >
          {option.description}
        </Tile>
      ))}
    </Gallery>
  )
}

function PasteInputButton(props: { setValue: (value: string) => void; setShowSecrets?: (value: boolean) => void }) {
  const { setValue, setShowSecrets } = props
  return (
    <Button
      variant="control"
      onClick={() => {
        navigator.clipboard.readText().then((value) => {
          setValue(value)
          if (value && setShowSecrets) setShowSecrets(false)
        })
      }}
    >
      <PasteIcon />
    </Button>
  )
}

function ClearInputButton(props: { onClick: () => void }) {
  const { onClick } = props
  return (
    <Button variant="control" onClick={onClick}>
      <TimesCircleIcon />
    </Button>
  )
}

function ShowSecretsButton(props: { showSecrets: boolean; setShowSecrets: (value: boolean) => void }) {
  const { showSecrets, setShowSecrets } = props
  return (
    <Button variant="control" onClick={() => setShowSecrets(!showSecrets)}>
      {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
    </Button>
  )
}

function OrderedItemsInput(props: {
  input: FormDataOrderedInput
  validated: 'error' | undefined
  isReadOnly: boolean
}) {
  const { input, isReadOnly } = props
  return (
    <Fragment>
      <DataList aria-label="draggable data list example" isCompact style={{ borderTop: '0' }}>
        {input.value.map((item, index) => {
          const key = input.keyFn(item, index)
          return (
            <DataListItem aria-labelledby="simple-item1" id={key} key={key}>
              <DataListItemRow>
                <DataListControl>
                  <DataListDragButton
                    aria-label="Reorder"
                    aria-labelledby="simple-item1"
                    aria-describedby="Press space or enter to begin dragging, and use the arrow keys to navigate up or down. Press enter to confirm the drag, or any other key to cancel the drag operation."
                    aria-pressed="false"
                    isDisabled={isReadOnly}
                  />
                </DataListControl>
                <DataListItemCells
                  dataListCells={input.cellsFn(item).map((cell, index) => (
                    <DataListCell key={`${key}-${index}`}>
                      {cell}
                      {/* <span id="simple-item1">{cell}</span> */}
                    </DataListCell>
                  ))}
                />
                <DataListAction
                  aria-labelledby="ex-item1 ex-action1"
                  id="ex-action1"
                  aria-label="Actions"
                  isPlainButtonAction
                >
                  <Split>
                    {input.onEdit && (
                      <Button variant="link" aria-label="Action" onClick={() => input.onEdit?.(item)}>
                        <EditIcon />
                      </Button>
                    )}
                    <Button
                      variant="plain"
                      aria-label="Action"
                      onClick={() =>
                        input.onChange(input.value.filter((item, index) => input.keyFn(item, index) !== key))
                      }
                    >
                      <TrashIcon />
                    </Button>
                  </Split>
                </DataListAction>
              </DataListItemRow>
            </DataListItem>
          )
        })}
      </DataList>
      <Button
        style={{ paddingTop: input.value.length > 0 ? '12px' : '0' }}
        variant="link"
        size="sm"
        onClick={() => input.onCreate?.()}
        icon={<PlusCircleIcon />}
      >
        {input.placeholder}
      </Button>
    </Fragment>
  )
}
