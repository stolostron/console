/* Copyright Contributors to the Open Cluster Management project */
import { Octokit } from '@octokit/rest'
import _ from 'lodash'
import { getSecret } from '.'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ChannelApiVersion = 'apps.open-cluster-management.io/v1'
export type ChannelApiVersionType = 'apps.open-cluster-management.io/v1'

export const ChannelKind = 'Channel'
export type ChannelKindType = 'Channel'

export const ChannelDefinition: IResourceDefinition = {
    apiVersion: ChannelApiVersion,
    kind: ChannelKind,
}

export interface Channel extends IResource {
    apiVersion: ChannelApiVersionType
    kind: ChannelKindType
    metadata: Metadata
    spec: {
        pathname: string
        type: string
        secretRef?: {
            name: string
        }
    }
}

async function getChannelSecret(secretArgs?: { secretRef?: string; namespace?: string }) {
    const channelSecret = { user: '', accessToken: '' }
    if (secretArgs && secretArgs.secretRef && secretArgs.namespace) {
        const { secretRef, namespace } = secretArgs
        await getSecret({ name: secretRef, namespace: namespace })
            .promise.then((response) => ({
                user: window.atob(_.get(response, 'data.user', '')),
                accessToken: window.atob(_.get(response, 'data.accessToken', '')),
            }))
            .then((data) => {
                if (data.user) channelSecret.user = data.user
                if (data.accessToken) channelSecret.accessToken = data.accessToken
            })
            .catch(handleGitError)
    }
    return channelSecret
}

async function getGitConnection(
    secretArgs?: { secretRef?: string; namespace?: string },
    accessData?: { user?: string; accessToken?: string }
) {
    if (accessData && accessData.user && accessData.accessToken) {
        const authBaseUrl = 'https://api.github.com'
        const authOptions = {
            baseUrl: authBaseUrl,
            auth: accessData.accessToken,
        }
        return new Octokit(authOptions)
    } else {
        return getChannelSecret(secretArgs)
            .then(({ accessToken }) => {
                const authBaseUrl = 'https://api.github.com'
                const authOptions = {
                    baseUrl: authBaseUrl,
                    auth: accessToken,
                }
                return new Octokit(authOptions)
            })
            .catch(handleGitError)
    }
}

export function getGitChannelBranches(
    channelPath: string,
    secretArgs?: { secretRef?: string; namespace?: string },
    accessData?: { user?: string; accessToken?: string }
) {
    const gitInfo = getGitInformation(channelPath)
    return getGitConnection(secretArgs, accessData)
        .then((octokit) =>
            octokit?.repos.listBranches(gitInfo).then(({ data }) => (data ? data.map((branch) => branch.name) : []))
        )
        .catch((err) => {
            handleGitError(err)
            return []
        })
}

export function getGitChannelPaths(
    channelPath: string,
    branch: string,
    secretArgs?: { secretRef?: string; namespace?: string },
    accessData?: { user?: string; accessToken?: string }
) {
    const gitInfo = getGitInformation(channelPath)
    return getGitConnection(secretArgs, accessData)
        .then((octokit) =>
            octokit?.repos
                .getBranch({
                    ...gitInfo,
                    branch,
                })
                .then(({ data }) => {
                    if (data?.commit?.sha != undefined) {
                        return octokit.git
                            .getTree({
                                ...gitInfo,
                                tree_sha: data?.commit?.sha || '',
                                recursive: 'true',
                            })
                            .then(({ data: result }) =>
                                result.tree
                                    ? result.tree.filter((item) => item.type === 'tree').map((item) => item.path)
                                    : []
                            )
                            .catch(handleGitError)
                    }
                })
        )
        .catch(handleGitError)
}

function getGitInformation(path: string) {
    const gitApiPath = new URL(path).pathname.substring(1).replace('.git', '').split('/')
    const gitOwner = gitApiPath.length > 0 ? gitApiPath[0] : ''
    const gitRepo = gitApiPath.length > 1 ? gitApiPath[1] : ''

    return { owner: gitOwner, repo: gitRepo }
}

const handleGitError = (err: any) => {
    console.log(Error(err))
}
