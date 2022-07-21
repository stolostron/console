/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { getSecret, unpackSecret } from '../../../../../resources'
import {
    AcmButton,
    AcmIcon,
    AcmIconVariant,
    AcmInlineCopy,
    AcmInlineStatus,
    StatusType,
} from '../../../../../ui-components'
import { ButtonVariant, Tooltip } from '@patternfly/react-core'
import { Fragment, useContext, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

export type LoginCredential = {
    username: string
    password: string
}

export type LoginCredentialStyle = {
    disabled: boolean
}

const useStyles = makeStyles({
    toggleButton: {
        paddingLeft: '0 !important',
        '& svg': {
            width: '24px',
            fill: (props: LoginCredentialStyle) => (props.disabled ? 'var(--pf-c-button--disabled--Color)' : '#06C'),
        },
        '& span': {
            color: (props: LoginCredentialStyle) =>
                props.disabled ? 'var(--pf-c-button--disabled--Color)' : undefined,
        },
        '& .credentials-toggle': {
            display: 'flex',
            alignItems: 'center',
            '& svg': {
                marginRight: '0.4rem',
            },
        },
        '&:hover': {
            '& .credentials-toggle svg': {
                fill: (props: LoginCredentialStyle) =>
                    props.disabled ? 'var(--pf-c-button--disabled--Color)' : 'var(--pf-c-button--m-link--hover--Color)',
            },
        },
    },
    credentialsContainer: {
        '& button': {
            paddingRight: 0,
        },
    },
})

export function LoginCredentials(props: { canGetSecret?: boolean }) {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation()
    const [isVisible, setVisible] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<boolean>(false)
    const [credentials, setCredentials] = useState<LoginCredential | undefined>(undefined)
    const disableButton = loading || error || !props.canGetSecret
    const classes = useStyles({ disabled: disableButton } as LoginCredentialStyle)

    const onClick = async () => {
        /* istanbul ignore next */
        const namespace = cluster?.namespace ?? ''
        /* istanbul ignore next */
        const name = cluster?.kubeadmin ?? ''
        if (!credentials && !isVisible && cluster?.kubeadmin) {
            setLoading(true)
            try {
                const secret = await getSecret({ name, namespace }).promise
                const { stringData } = unpackSecret(secret)
                setCredentials(stringData as LoginCredential)
                setVisible(!isVisible)
            } catch (err) {
                setError(true)
            } finally {
                setLoading(false)
            }
        } else {
            setVisible(!isVisible)
        }
    }

    if (cluster?.kubeadmin) {
        return (
            <Fragment>
                {!isVisible && <div>&#8226;&#8226;&#8226;&#8226;&#8226; / &#8226;&#8226;&#8226;&#8226;&#8226;</div>}
                {isVisible && (
                    <div className={classes.credentialsContainer}>
                        <AcmInlineCopy
                            text={/* istanbul ignore next */ credentials?.username ?? 'kubeadmin'}
                            id="username-credentials"
                        />
                        {'  /  '}
                        <AcmInlineCopy
                            text={/* istanbul ignore next */ credentials?.password ?? ''}
                            id="password-credentials"
                        />
                    </div>
                )}
                <AcmButton
                    variant={ButtonVariant.link}
                    className={classes.toggleButton}
                    onClick={onClick}
                    isDisabled={disableButton}
                    id="login-credentials"
                >
                    <Fragment>
                        {(() => {
                            if (error) {
                                return <AcmInlineStatus type={StatusType.danger} status={t('credentials.failed')} />
                            } else if (loading) {
                                return <AcmInlineStatus type={StatusType.progress} status={t('credentials.loading')} />
                            } else if (!props.canGetSecret) {
                                return (
                                    <Tooltip content={t('rbac.unauthorized')}>
                                        <div className="credentials-toggle">
                                            <AcmIcon
                                                icon={
                                                    isVisible
                                                        ? AcmIconVariant.visibilityoff
                                                        : AcmIconVariant.visibilityon
                                                }
                                            />
                                            {isVisible ? t('credentials.hide') : t('credentials.show')}
                                        </div>
                                    </Tooltip>
                                )
                            } else {
                                return (
                                    <div className="credentials-toggle">
                                        <AcmIcon
                                            icon={
                                                isVisible ? AcmIconVariant.visibilityoff : AcmIconVariant.visibilityon
                                            }
                                        />
                                        {isVisible ? t('credentials.hide') : t('credentials.show')}
                                    </div>
                                )
                            }
                        })()}
                    </Fragment>
                </AcmButton>
            </Fragment>
        )
    } else {
        return <>-</>
    }
}
