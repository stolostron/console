/* Copyright Contributors to the Open Cluster Management project */
import { makeStyles } from '@material-ui/styles'
import { PageSection } from '@patternfly/react-core'
import { AcmAlert, AcmButton, AcmLoadingPage } from '../../../../ui-components'
import jsYaml from 'js-yaml'
import { useEffect, useState } from 'react'
import YamlEditor from '../../../../components/YamlEditor'
import { useTranslation } from '../../../../lib/acm-i18next'
import { canUser } from '../../../../lib/rbac-util'
import { fireManagedClusterAction } from '../../../../resources/managedclusteraction'

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
    resource: any
    loading: boolean
    error: string
    name: string
    namespace: string
    cluster: string
    kind: string
    apiversion: string
}) {
    const { resource, loading, error, name, namespace, cluster, kind, apiversion } = props
    const { t } = useTranslation()
    const [editMode, setEditMode] = useState<boolean>(false)
    const [userCanEdit, setUserCanEdit] = useState<boolean | undefined>(undefined)
    const [editedResourceYaml, setEditedResourceYaml] = useState<string>('')
    const [updateResourceError, setUpdateResourceError] = useState(undefined)
    const [editorHeight, setEditorHeight] = useState('500px')
    const classes = useStyles()

    useEffect(() => {
        if (resource) {
            setEditedResourceYaml(jsYaml.dump(resource, { indent: 2 }))
        }
    }, [resource])

    useEffect(() => {
        function handleResize() {
            setEditorHeight(`${(window.innerHeight - 275) * 0.95}px`)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!editedResourceYaml) {
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
    }, [apiversion, cluster, editedResourceYaml, kind, name, namespace])

    function fireUpdateResource() {
        fireManagedClusterAction(
            'Update',
            cluster,
            kind,
            apiversion,
            name,
            namespace,
            jsYaml.loadAll(editedResourceYaml)[0]
        )
            .then((actionResponse) => {
                if (actionResponse.actionDone === 'ActionDone') {
                    setEditMode(false)
                    setEditedResourceYaml(jsYaml.dump(actionResponse.result, { indent: 2 }))
                } else {
                    setUpdateResourceError(actionResponse.message)
                }
            })
            .catch((err) => {
                console.error('Error updating resource: ', err)
                setUpdateResourceError(err)
            })
    }

    if (error) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('Error querying for resource:')} ${name}`}
                    subtitle={error}
                />
            </PageSection>
        )
    } else if (loading) {
        return (
            <PageSection>
                <AcmLoadingPage />
            </PageSection>
        )
    }
    let tooltipMessage = t('Enable resource editing')
    if (!userCanEdit) {
        tooltipMessage = t('You are not allowed to edit this resource')
    } else if (editMode) {
        tooltipMessage = t('Cancel Edits')
    }
    return (
        <PageSection>
            {updateResourceError && (
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('Error occurred while updating resource:')} ${name}`}
                    subtitle={updateResourceError}
                />
            )}
            <div className={classes.headerContainer}>
                {/* No translation - this is a kube resource */}
                <p className={classes.textTitle}>{'Cluster:'}</p>
                <p className={classes.textContent}>{cluster}</p>
                <div className={classes.spacer} />
                {/* No translation - this is a kube resource */}
                <p className={classes.textTitle}>{'Namespace:'}</p>
                <p className={classes.textContent}>{namespace.length > 0 ? namespace : 'Resource is not namespaced'}</p>
                <div className={classes.editButtonContainer}>
                    <p className={classes.editButtonLabel}>{editMode ? t('Editing mode') : t('Read only mode')}</p>
                    <AcmButton
                        variant={'primary'}
                        isDisabled={!userCanEdit}
                        onClick={() => {
                            setEditMode(!editMode)
                        }}
                        tooltip={tooltipMessage}
                    >
                        {editMode ? t('Cancel') : t('Edit')}
                    </AcmButton>
                    {editMode && (
                        <AcmButton
                            className={classes.saveButton}
                            variant={'primary'}
                            onClick={() => fireUpdateResource()}
                        >
                            {t('Save')}
                        </AcmButton>
                    )}
                </div>
            </div>
            <YamlEditor
                resourceYAML={editedResourceYaml}
                editMode={editMode}
                setEditedResourceYaml={setEditedResourceYaml}
                width={'100%'}
                height={editorHeight}
            />
        </PageSection>
    )
}
