/* Copyright Contributors to the Open Cluster Management project */
import { NamespaceApiVersion, NamespaceKind } from '../../resources'

export const mockNamespaces = [
    {
        apiVersion: NamespaceApiVersion,
        kind: NamespaceKind,
        metadata: { name: 'default' },
    },
    {
        apiVersion: NamespaceApiVersion,
        kind: NamespaceKind,
        metadata: { name: 'test' },
    },
]
