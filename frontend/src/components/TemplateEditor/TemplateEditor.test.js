/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import TemplateEditor from './TemplateEditor'
import { render, fireEvent, act, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter as Router } from 'react-router-dom-v5-compat'
// loads mocked monaco from __mocks__
import MonacoEditor from 'react-monaco-editor'

class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
}

const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  createBtn: 'create-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
})

describe('TemplateEditor component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const Component = (props) => {
    return (
      <Router>
        <div id={Portals.editBtn} />
        <div id={Portals.cancelBtn} />
        <div id={Portals.createBtn} />
        <TemplateEditor {...props} />{' '}
      </Router>
    )
  }

  it('creation path with form', async () => {
    let updatedControl
    props.template = (templateData) => {
      if (templateData.name === 'test' && templateData.namespace === 'testing') {
        return (
          'apiVersion: v1\n' +
          'kind: Secret\n' +
          'type: Opaque\n' +
          'metadata:\n' +
          '  name: test\n' +
          "  namespace: 'testing'\n" +
          'stringData:\n' +
          '  aws_access_key_id: \n' +
          '  aws_secret_access_key: # injected on create\n' +
          ''
        )
      }
      return ''
    }
    props.onControlChange = (control) => {
      updatedControl = control
    }

    const { rerender } = render(<Component {...props} />)

    // fill in form
    userEvent.type(
      screen.getByRole('textbox', {
        name: /creation\.app\.name/i,
      }),
      'test'
    )
    userEvent.type(
      screen.getByRole('combobox', {
        name: /creation.app.namespace/i,
      }),
      'testing'
    )
    userEvent.click(screen.getByText(/channel\.type\.git/i))
    userEvent.type(screen.getByLabelText(/creation\.app\.github\.url \*/i), 'https://github.com/fxiang1/app-samples')
    userEvent.type(screen.getByLabelText(/creation\.app\.github\.path/i), 'ansible')
    userEvent.click(
      screen.getByRole('radio', {
        name: /creation\.app\.settings\.localclusters/i,
      })
    )

    updatedControl.forceUpdate()

    // add a group
    userEvent.click(
      screen.getByRole('button', {
        name: /creation\.app\.add\.channel/i,
      })
    )
    window.dispatchEvent(new Event('beforeunload'))

    // cancel/create
    userEvent.click(
      screen.getByRole('button', {
        name: /button\.cancel/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /button\.create/i,
      })
    )
    window.dispatchEvent(new Event('beforeunload'))

    props.createControl.creationStatus = 'IN_PROGRESS'
    rerender(<Component {...props} />)
    props.createControl.creationStatus = 'DONE'
    rerender(<Component {...props} />)
    props.createControl.creationStatus = 'IN_PROGRESS'
    props.createControl.creationMsg = ['message']
    rerender(<Component {...props} />)
    props.createControl.creationStatus = 'DONE'
    rerender(<Component {...props} />)
    props.createControl.creationStatus = 'ERROR'
    rerender(<Component {...props} />)
    props.createControl = {}
    props.editorReadOnly = true
    rerender(<Component {...props} />)
    props.editorReadOnly = false
  })

  it.skip('yaml editing/toolbar', async () => {
    window.ResizeObserver = ResizeObserver
    document.execCommand = () => {}

    render(<Component {...props} />)

    // open editor
    let yamlBtn = await waitFor(() =>
      screen.getByRole('checkbox', {
        name: /edit\.yaml\.on/i,
      })
    )
    yamlBtn.click()

    // type something in
    const editor = await waitFor(() =>
      screen.getByRole('textbox', {
        name: /monaco/i,
      })
    )
    let newValue = JSON.stringify([{ key: false }])
    act(() => {
      fireEvent.change(editor, {
        target: { value: newValue },
      })
    })
    // wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 1000))

    //undo
    userEvent.click(
      screen.getByRole('button', {
        name: /editor\.bar\.undo/i,
      })
    )
    //redo
    userEvent.click(
      screen.getByRole('button', {
        name: /editor\.bar\.redo/i,
      })
    )

    // find
    const findTextbox = screen.getByRole('textbox', {
      name: /find\.label/i,
    })
    act(() => {
      fireEvent.change(findTextbox, {
        target: { value: 'this' },
      })
    })
    act(() => {
      fireEvent.change(findTextbox, {
        target: { value: '' },
      })
    })
    act(() => {
      fireEvent.change(findTextbox, {
        target: { value: 'that' },
      })
    })

    // next/previous
    userEvent.click(
      screen.getByRole('button', {
        name: /editor\.bar\.next/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /editor\.bar\.previous/i,
      })
    )

    // copy
    userEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }))

    // secrets
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /show-secrets/i,
      })
    )

    // press reset
    userEvent.click(screen.getByText(/editor\.bar\.reset/i))

    // close
    const btn = screen.getByRole('button', {
      name: /editor\.bar\.close/i,
    })
    userEvent.click(btn)
    expect(btn).not.toBeInTheDocument()
  })

  it('other branches', async () => {
    props.initialOpen = true
    render(<Component {...props} />)
    await waitFor(() =>
      screen.getByRole('textbox', {
        name: /monaco/i,
      })
    )

    // edit existing
    // multi tabs
  })
})

const props = {
  type: 'application',
  title: 'Application YAML',
  monacoEditor: <MonacoEditor />,
  initialOpen: false,
  controlData: [
    {
      id: 'showSecrets',
      type: 'hidden',
      active: false,
    },
    {
      name: 'creation.app.name',
      tooltip: 'tooltip.creation.app.name',
      id: 'name',
      type: 'text',
      editing: {
        disabled: true,
      },
      onSelect: () => {} /*updateNameControls*/,
      validation: {
        constraint: '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$',
        notification: 'import.form.invalid.dns.label',
        required: true,
      },
      reverse: 'Application[0].metadata.name',
    },
    {
      name: 'creation.app.namespace',
      tooltip: 'tooltip.creation.app.namespace',
      id: 'namespace',
      type: 'combobox',
      immutable: { path: 'ClusterDeployment[0].spec.installAttemptsLimit' },
      // fetchAvailable: {
      //     query: () => {} /*query*/,
      //     loadingDesc: 'Loading namespaces...',
      //     setAvailable: () => {} /*bound setAvailableNSSpecs*/,
      // },
      editing: {
        disabled: true,
      },
      onSelect: () => {} /*updateNSControls*/,
      validation: {
        constraint: '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$',
        notification: 'import.form.invalid.dns.label',
        required: true,
      },
      reverse: 'Application[0].metadata.namespace',
    },
    {
      id: 'userDefinedNamespace',
      type: 'hidden',
      active: '',
    },
    {
      id: 'selfLink',
      type: 'hidden',
      active: '',
    },
    {
      id: 'channelSection',
      type: 'section',
      title: 'creation.app.channels',
      collapsable: true,
      collapsed: false,
    },
    {
      id: 'channels',
      type: 'group',
      prompts: {
        nameId: 'channelPrompt',
        baseName: 'resource',
        addPrompt: 'creation.app.add.channel',
        deletePrompt: 'creation.app.delete.channel',
      },
      discover: () => {} /*discoverGroupsFromSource*/,
      shift: () => {} /*shiftTemplateObject*/,
      controlData: [
        {
          id: 'channel',
          type: 'section',
          title: 'creation.app.channel.title',
          collapsable: true,
          collapsed: false,
          subgroup: true,
          info: () => {} /*getSharedSubscriptionWarning*/,
          editing: {
            editMode: true,
          },
        },
        {
          id: 'channelPrompt',
          type: 'hidden',
          active: '',
        },
        {
          id: 'selfLinks',
          type: 'hidden',
          active: '',
        },
        {
          id: 'channelType',
          type: 'cards',
          sort: false,
          collapseCardsControlOnSelect: true,
          scrollViewToTopOnSelect: true,
          title: 'creation.app.channel.type',
          collapsable: true,
          collapsed: false,
          available: [
            {
              id: 'github',
              logo: </*SVGIcon*/></>,
              title: 'channel.type.git',
              tooltip: 'tooltip.creation.app.channel.git',
              change: {
                insertControlData: [
                  {
                    id: 'channelNamespaceExists',
                    type: 'hidden',
                    active: true,
                  },
                  {
                    id: 'channelName',
                    type: 'hidden',
                    active: '',
                  },
                  {
                    id: 'channelNamespace',
                    type: 'hidden',
                    active: '',
                  },
                  {
                    name: 'creation.app.github.url',
                    tooltip: 'tooltip.creation.app.github.url',
                    id: 'githubURL',
                    type: 'combobox',
                    active: '',
                    placeholder: 'app.enter.select.github.url',
                    available: [],
                    validation: {
                      tester: {
                        test: () => {} /*test*/,
                      },
                      notification: 'creation.invalid.url',
                      required: true,
                    },
                    // fetchAvailable: {
                    //     query: () => {} /*query*/,
                    //     loadingDesc: 'creation.app.loading.channels',
                    //     setAvailable: () => {} /*bound setAvailableChannelSpecs*/,
                    // },
                    reverse: 'Channel[0].spec.pathname',
                    onSelect: () => {} /*updateChannelControls*/,
                    simplified: () => {} /*channelSimplified*/,
                  },
                  {
                    name: 'creation.app.github.branch',
                    tooltip: 'tooltip.creation.app.github.branch',
                    id: 'githubBranch',
                    type: 'combobox',
                    active: '',
                    placeholder: 'app.enter.select.branch',
                    available: [],
                    validation: {
                      tester: {
                        test: () => {} /*validateBranch*/,
                      },
                      notification: 'creation.valid.gitbranch',
                      required: false,
                    },
                    reverse: [
                      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/github-branch"]',
                      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-branch"]',
                    ],
                    onSelect: () => {} /*updateGitBranchFolders*/,
                    cacheUserValueKey: 'create.app.github.branch',
                  },
                  {
                    name: 'creation.app.github.path',
                    tooltip: 'tooltip.creation.app.github.path',
                    id: 'githubPath',
                    type: 'combobox',
                    active: '',
                    placeholder: 'app.enter.select.path',
                    available: [],
                    validation: '^.+/[A-Za-z0-9]+(/[A-Za-z0-9-_\\.]*[A-Za-z0-9]+)*$',
                    reverse: [
                      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/github-path"]',
                      'Subscription[0].metadata.annotations["apps.open-cluster-management.io/git-path"]',
                    ],
                    cacheUserValueKey: 'create.app.github.path',
                  },
                  {
                    id: 'existingrule-checkbox',
                    type: 'radio',
                    name: 'creation.app.settings.existingRule',
                    tooltip: 'tooltip.creation.app.settings.existingRule',
                    onSelect: () => {}, //updatePlacementControls,
                    active: true,
                    summarize: () => {} /*summarizeOnline*/,
                  },
                  {
                    id: 'placementrulecombo',
                    type: 'combobox',
                    opaque: false,
                    placeholder: 'creation.app.settings.existingRule',
                    reverse: () => {} /*reverseExistingRule*/,
                    onSelect: () => {} /*updateNewRuleControls*/,
                    validation: {},
                    summarize: () => {} /*summarize*/,
                  },
                  {
                    id: 'selectedRuleName',
                    type: 'hidden',
                    reverse: () => {} /*reverseExistingRule*/,
                  },
                  {
                    id: 'enableHubSelfManagement',
                    type: 'hidden',
                    active: true,
                  },
                  {
                    id: 'online-cluster-only-checkbox',
                    type: 'radio',
                    name: 'creation.app.settings.onlineClusters',
                    tooltip: 'tooltip.creation.app.settings.onlineClusters',
                    active: false,
                    available: [],
                    onSelect: () => {}, //updatePlacementControls,
                    reverse: () => {} /*reverseOnline*/,
                    summarize: () => {} /*summarize*/,
                  },
                  {
                    id: 'local-cluster-checkbox',
                    type: 'radio',
                    name: 'creation.app.settings.localClusters',
                    tooltip: 'tooltip.creation.app.settings.localClusters',
                    onSelect: () => {}, //updatePlacementControls,
                    active: false,
                    available: [],
                    reverse: [
                      'Subscription[0].spec.placement.local',
                      'PlacementRule[0].spec.clusterSelector.matchLabels.local-cluster',
                    ],
                    summarize: () => {} /*summarize*/,
                  },
                ],
              },
            },
          ],
          active: '',
          validation: {},
        },
      ],
    },
  ],
  template: () => {} /*ret*/,
  portals: {
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
  },
  fetchControl: null,
  createControl: {
    createResource: () => {} /*handleCreate*/,
    cancelCreate: () => {} /*cancelCreate*/,
    pauseCreate: () => {} /*pauseCreate*/,
  },
  onControlInitialize: () => {} /*onControlInitialize*/,
  onControlChange: () => {} /**/,
  logging: false,
  i18n: (k) => k /*fixedT*/,
}
