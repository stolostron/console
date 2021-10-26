/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { makeStyles } from '@material-ui/styles'
import { AcmAlert, AcmButton, AcmLoadingPage } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
import jsYaml from 'js-yaml'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MonacoEditor, { monaco } from 'react-monaco-editor'
import { consoleClient } from '../../../console-sdk/console-client'
import { Query, useUpdateResourceLazyQuery } from '../../../console-sdk/console-sdk'
import { canUser } from '../../../lib/rbac-util'
import './YAMLEditor.css'

monaco.editor.defineTheme('console', {
    base: 'vs-dark',
    inherit: true,
    rules: [
        // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
        { token: 'number', foreground: 'ace12e' },
        { token: 'type', foreground: '73bcf7' },
        { token: 'string', foreground: 'f0ab00' },
        { token: 'keyword', foreground: 'cbc0ff' },
    ],
    colors: {
        'editor.background': editorBackground.value,
        'editorGutter.background': '#292e34', // no pf token defined
        'editorLineNumber.activeForeground': '#fff',
        'editorLineNumber.foreground': '#f0f0f0',
    },
})
monaco.editor.setTheme('console')

const useStyles = makeStyles({
    headerContainer: {
        display: 'flex',
        backgroundColor: 'var(--pf-global--palette--black-850)',
        fontSize: '14px',
    },
    spacer: {
        borderRight: '1px solid var(--pf-global--palette--black-700)',
        paddingLeft: '1rem',
    },
    textTitle: {
        color: 'var(--pf-global--palette--black-300)',
        padding: '1rem',
    },
    textContent: {
        color: 'var(--pf-global--palette--white)',
        padding: '1rem 0',
        fontWeight: 700,
    },
    editButtonContainer: {
        display: 'flex',
        color: 'var(--pf-global--palette--white)',
        alignItems: 'center',
        margin: '0 10px 0 auto',
    },
    editButtonLabel: {
        paddingRight: '.5rem',
    },
    saveButton: {
        marginLeft: '.5rem',
    },
})

export default function YAMLPage(props: {
    resource: Pick<Query, 'getResource'> | undefined
    loading: boolean
    error: ApolloError | undefined
    name: string
    namespace: string
    cluster: string
    kind: string
    apiversion: string
}) {
    const { resource, loading, error, name, namespace, cluster, kind, apiversion } = props
    const { t } = useTranslation(['details'])
    const [editMode, setEditMode] = useState<boolean>(false)
    const [userCanEdit, setUserCanEdit] = useState<boolean | undefined>(undefined)
    const [editedResourceYaml, setEditedResourceYaml] = useState<string>('')
    const classes = useStyles()
    useEffect(() => {
        if (resource?.getResource) {
            setEditedResourceYaml(jsYaml.dump(resource?.getResource, { indent: 2 }))
        }
    }, [resource?.getResource])

    useEffect(() => {
        if (!resource) {
            return
        }
        const canUpdateResource = canUser(
            'update',
            {
                apiVersion: apiversion,
                kind,
                metadata: {
                    name,
                    namespace,
                },
            },
            cluster === 'local-cluster' ? namespace : cluster,
            name
        )

        canUpdateResource.promise
            .then((result) => setUserCanEdit(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canUpdateResource.abort()
    }, [cluster, resource])

    const [updateResource, { error: updateResourceError }] = useUpdateResourceLazyQuery({
        client: consoleClient,
        onCompleted: (res) => {
            setEditMode(false)
            setEditedResourceYaml(jsYaml.dump(res.updateResource, { indent: 2 }))
        },
    })

    if (error) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('yaml.getresource.error')} ${name}`}
                    subtitle={error?.message}
                />
            </PageSection>
        )
    } else if (resource?.getResource?.message ?? (resource?.getResource[0] && resource?.getResource[0].message)) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('yaml.getresource.error')} ${name}`}
                    subtitle={
                        resource?.getResource?.message ?? (resource?.getResource[0] && resource?.getResource[0].message)
                    }
                />
            </PageSection>
        )
    }
    if (loading) {
        return (
            <PageSection>
                <AcmLoadingPage />
            </PageSection>
        )
    }
    let tooltipMessage = t('yaml.tooltip.enable')
    if (!userCanEdit) {
        tooltipMessage = t('yaml.tooltip.unauthorized')
    } else if (editMode) {
        tooltipMessage = t('yaml.tooltip.cancel')
    }
    return (
        <PageSection>
            {updateResourceError && (
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('yaml.update.resource.error')} ${name}`}
                    subtitle={updateResourceError.message}
                />
            )}
            <div className={classes.headerContainer}>
                {/* No translation - this is a kube resource */}
                <p className={classes.textTitle}>{'Cluster:'}</p>
                <p className={classes.textContent}>{cluster}</p>
                <div className={classes.spacer} />
                {/* No translation - this is a kube resource */}
                <p className={classes.textTitle}>{'Namespace:'}</p>
                <p className={classes.textContent}>{namespace}</p>
                <div className={classes.editButtonContainer}>
                    <p className={classes.editButtonLabel}>
                        {editMode ? t('yaml.editor.mode.editing') : t('yaml.editor.mode.readonly')}
                    </p>
                    <AcmButton
                        variant={'primary'}
                        isDisabled={!userCanEdit}
                        onClick={() => {
                            if (editMode) {
                                // Reset YAML on cancel click
                                setEditedResourceYaml(editedResourceYaml)
                            }
                            setEditMode(!editMode)
                        }}
                        tooltip={tooltipMessage}
                    >
                        {editMode ? t('yaml.editor.cancel') : t('yaml.editor.edit')}
                    </AcmButton>
                    {editMode && (
                        <AcmButton
                            className={classes.saveButton}
                            variant={'primary'}
                            onClick={() => {
                                updateResource({
                                    variables: {
                                        namespace,
                                        kind,
                                        name,
                                        body: jsYaml.loadAll(editedResourceYaml)[0],
                                        cluster,
                                    },
                                })
                            }}
                        >
                            {t('yaml.editor.save')}
                        </AcmButton>
                    )}
                </div>
            </div>
            <MonacoEditor
                theme={'console'}
                width={'100%'}
                height={'90%'}
                value={
                    editedResourceYaml !== '' ? editedResourceYaml : jsYaml.dump(resource?.getResource, { indent: 2 })
                }
                onChange={(value) => {
                    setEditedResourceYaml(value)
                }}
                language={'yaml'}
                options={{
                    colorDecorators: true,
                    readOnly: !editMode,
                    fontSize: 12,
                    wordWrap: 'wordWrapColumn',
                    wordWrapColumn: 132,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    glyphMargin: true,
                    tabSize: 2,
                    renderIndentGuides: false,
                    scrollbar: {
                        verticalScrollbarSize: 17,
                        horizontalScrollbarSize: 17,
                    },
                }}
            />
        </PageSection>
    )
}
