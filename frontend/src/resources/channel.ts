/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { Octokit } from '@octokit/rest'
import { getSecret, listResources } from '.'
import _ from 'lodash'

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
        secretRef?: string
    }
}

export function listChannels() {
    return listResources<Channel>({
        apiVersion: ChannelApiVersion,
        kind: ChannelKind,
    })
}

async function getChannelSecret(secretArgs?: { secretRef?: string; namespace?: string }) {
    if (secretArgs && secretArgs.secretRef && secretArgs.namespace) {
        const { secretRef, namespace } = secretArgs
        return getSecret({ name: secretRef, namespace: namespace })
            .promise.then((response) => ({
                user: window.atob(_.get(response, 'data.user', '')),
                accessToken: window.atob(_.get(response, 'data.accessToken', '')),
            }))
            .catch(handleGitError)
    } else return { user: '', accessToken: '' }
}

function getGitConnection(secretArgs?: { secretRef?: string; namespace?: string }) {
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

export function getGitChannelBranches(channelPath: string, secretArgs?: { secretRef?: string; namespace?: string }) {
    const gitInfo = getGitInformation(channelPath)
    return getGitConnection(secretArgs)
        .then((octokit) =>
            octokit?.repos.listBranches(gitInfo).then(({ data }) => (data ? data.map((branch) => branch.name) : []))
        )
        .catch(handleGitError)
}

export function getGitChannelPaths(
    channelPath: string,
    branch: string,
    secretArgs?: { secretRef?: string; namespace?: string }
) {
    const gitInfo = getGitInformation(channelPath)
    return getGitConnection(secretArgs)
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
    throw Error(err)
}
