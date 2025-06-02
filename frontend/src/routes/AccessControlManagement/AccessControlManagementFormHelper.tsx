/* Copyright Contributors to the Open Cluster Management project */
const selectedNamespacesToRoleBinding = (
  selectedNamespaces: string[],
  selectedRoleNames: string[],
  selectedSubjectNames: string[],
  selectedSubjectType: 'User' | 'Group'
) =>
  selectedNamespaces.flatMap((ns) =>
    selectedRoleNames.map((role) => ({
      namespace: ns,
      roleRef: {
        name: role,
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
      },
      subjects: selectedSubjectNames.map((name) => ({
        name,
        apiGroup: 'rbac.authorization.k8s.io',
        kind: selectedSubjectType,
      })),
    }))
  )

export { selectedNamespacesToRoleBinding }
