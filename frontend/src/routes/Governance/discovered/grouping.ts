/* Copyright Contributors to the Open Cluster Management project */
type TResolveSource = (annotations: { [key: string]: any }, helmReleases: any, channels: any, subscriptions: any) => any

type TGetSourceText = (policySource: any, isExternal: boolean, t: any) => string

type TParseStringMap = (anoString: string) => { [key: string]: string }

type TParseDiscoveredPolicies = (data: any) => any
export interface ISourceType {
  type: any //ex: 'Policy' | 'Git' | 'Multiple'
  parentNs: string
  parentName: string
}

export function grouping(): {
  getPolicySource: (
    policy: any,
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSource: TResolveSource,
    getSourceText: TGetSourceText,
    parseStringMap: TParseStringMap
  ) => ISourceType
  createMessage: (
    data: any[],
    kyvernoPolicyReports: any[],
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSource: string,
    getSourceText: string,
    parseStringMap: string,
    parseDiscoveredPolicies: string
  ) => any[]
} {
  const getPolicySource = (
    policy: any,
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSource: TResolveSource,
    getSourceText: TGetSourceText,
    parseStringMap: TParseStringMap
  ): ISourceType => {
    const parentPolicy = parseStringMap(policy.label)['policy.open-cluster-management.io/policy']
    const parentNs = parentPolicy?.split('.')[0] ?? ''
    const parentName = parentPolicy?.split('.')[1] ?? ''

    if (parentNs && parentName) {
      return {
        type: 'Policy',
        parentNs,
        parentName,
      }
    }

    const isExternal = policy._isExternal
    let source: string = 'Local'
    if (isExternal) {
      const policySource = resolveSource(parseStringMap(policy.annotation), helmReleases, channels, subscriptions)
      source = policySource ? getSourceText(policySource, isExternal, (s: string) => s) : 'Managed externally'
    }
    // source is string
    return {
      type: source,
      parentNs: '',
      parentName: '',
    }
  }

  enum PolicySeverity {
    Unknown,
    Low,
    Medium,
    High,
    Critical,
  }

  const severityTable = (severity: string): number => {
    if (!severity) return PolicySeverity.Unknown

    switch (severity.toLowerCase()) {
      case 'low':
        return PolicySeverity.Low
      case 'medium':
        return PolicySeverity.Medium
      case 'high':
        return PolicySeverity.High
      case 'critical':
        return PolicySeverity.Critical
      default:
        // unknown or null
        return PolicySeverity.Unknown
    }
  }

  const getSeverity = (policy: any, parseStringMap: TParseStringMap): string => {
    if (policy?.severity) {
      return policy.severity.toLowerCase()
    }

    return (parseStringMap(policy.annotation)['policy.open-cluster-management.io/severity'] ?? '').toLowerCase()
  }

  const getResponseAction = (policy: any): string | null => {
    if (policy?.remediationAction) {
      return policy.remediationAction.toLowerCase()
    } else if (policy?.enforcementAction) {
      return policy.enforcementAction
    } else if (policy.apigroup === 'constraints.gatekeeper.sh') {
      // The default is deny when unset.
      return 'deny'
    } else if (policy.kind === 'ValidatingAdmissionPolicyBinding') {
      // Required field
      if (policy.validationActions) {
        return policy.validationActions
          .split('; ')
          .sort() //NOSONAR
          .join('/')
      }
    } else if (policy.apigroup === 'kyverno.io') {
      return policy.validationFailureAction
    }

    return null
  }

  const createMessage = (
    data: any[],
    kyvernoPolicyReports: any[],
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSourceStr: string,
    getSourceTextStr: string,
    parseStringMapStr: string,
    parseDiscoveredPoliciesStr: string
  ): any[] => {
    if (data?.length === 0) {
      return []
    }

    const resolveSource = eval(resolveSourceStr) as TResolveSource
    const getSourceText = eval(getSourceTextStr) as TGetSourceText
    const parseStringMap = eval(parseStringMapStr) as TParseStringMap
    const parseDiscoveredPolicies = eval(parseDiscoveredPoliciesStr) as TParseDiscoveredPolicies

    const kyvernoViolationMap: { [policyNamespaceName: string]: number } = {}

    if (kyvernoPolicyReports.length > 0) {
      kyvernoPolicyReports.forEach((cr) => {
        const kindNameViolation = cr.policyViolationCounts?.split('=') ?? []
        kyvernoViolationMap[kindNameViolation[0]] =
          (kyvernoViolationMap[kindNameViolation[0]] ?? 0) + Number(kindNameViolation[1])
      })
    }

    const policiesWithSource = (parseDiscoveredPolicies(data) as any[])
      ?.filter(
        // Filter out ValidatingAdmissionPolicyBinding instances created by Gatekeeper.
        (policy: any): any =>
          !(policy.kind === 'ValidatingAdmissionPolicyBinding' && policy['_ownedByGatekeeper'] === 'true')
      )
      .map((policy: any): any => {
        const sourceAdded = {
          ...policy,
          source: getPolicySource(
            policy,
            helmReleases,
            channels,
            subscriptions,
            resolveSource,
            getSourceText,
            parseStringMap
          ),
        }
        // Add violation to kyverno
        if (policy.apigroup === 'kyverno.io') {
          const key = policy.namespace ? policy.namespace + '/' + policy.name : policy.name
          return {
            ...sourceAdded,
            responseAction: policy.validationFailureAction,
            // Possibility that a Policy or ClusterPolicy may not have a PolicyReport.
            totalViolations: kyvernoViolationMap[key] ?? 0,
          }
        }

        return sourceAdded
      })

    const groupByNameKindGroup: { [nameKindGroup: string]: any[] } = {}
    // Group by policy name, kind and apigroup
    policiesWithSource?.forEach((p: any) => {
      const nameKindGroup: string = p['name'] + p['kind'] + p['apigroup'] || ''
      const existingGroup = groupByNameKindGroup[nameKindGroup] || []
      existingGroup.push(p)
      groupByNameKindGroup[nameKindGroup] = existingGroup
    })

    const keys = Object.keys(groupByNameKindGroup)

    return keys.map((nameKindGroup) => {
      const group = groupByNameKindGroup[nameKindGroup] || []

      let highestSeverity = 0
      const allResponseActions: Set<string> = new Set()

      let source = { ...group[0].source }

      for (const policy of group) {
        policy.severity = getSeverity(policy, parseStringMap)

        // Set to highest severity among grouped policies
        if (severityTable(policy.severity) > highestSeverity) {
          highestSeverity = severityTable(policy.severity)
        }

        const responseAction = getResponseAction(policy)

        if (responseAction) {
          policy.responseAction = responseAction
          if (policy.kind === 'ValidatingAdmissionPolicyBinding') {
            for (const action of responseAction.split('/')) {
              allResponseActions.add(action)
            }
          } else {
            allResponseActions.add(responseAction)
          }
        }

        if (source.type === 'Multiple') {
          continue
        }

        if (
          policy.source.type !== source.type ||
          policy.source.parentNs !== source.parentNs ||
          policy.source.parentName !== source.parentName
        ) {
          source = {
            type: 'Multiple',
            parentNs: '',
            parentName: '',
          }
        }
      }

      let responseAction: string
      const allResponseActionsList: string[] = Array.from(allResponseActions)

      if (allResponseActions.size === 1) {
        responseAction = allResponseActionsList[0]
      } else if (
        allResponseActions.size === 2 &&
        allResponseActions.has('inform') &&
        allResponseActions.has('enforce')
      ) {
        responseAction = 'inform/enforce'
      } else {
        // Ignore the SonarCloud recommendation of sorting by locale since this is an API field.
        responseAction = allResponseActionsList.sort().join('/') //NOSONAR
      }

      return {
        id: nameKindGroup,
        apigroup: group[0].apigroup,
        name: group[0].name,
        kind: group[0].kind,
        severity: PolicySeverity[highestSeverity].toLowerCase(),
        responseAction,
        policies: group,
        source,
      }
    })
  }

  self.onmessage = (e: MessageEvent<any>) => {
    const {
      data,
      kyvernoPolicyReports,
      helmReleases,
      channels,
      subscriptions,
      resolveSourceStr,
      getSourceTextStr,
      parseStringMapStr,
      parseDiscoveredPoliciesStr,
    } = e.data

    self.postMessage(
      createMessage(
        data,
        kyvernoPolicyReports,
        helmReleases,
        channels,
        subscriptions,
        resolveSourceStr,
        getSourceTextStr,
        parseStringMapStr,
        parseDiscoveredPoliciesStr
      )
    )
  }

  // Return for unit test
  return {
    getPolicySource: getPolicySource,
    createMessage: createMessage,
  }
}
