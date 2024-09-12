/* Copyright Contributors to the Open Cluster Management project */
type TResolveSource = (annotations: { [key: string]: any }, helmReleases: any, channels: any, subscriptions: any) => any

type TGetSourceText = (policySource: any, isExternal: boolean, t: any) => string

type TParseStringMap = (anoString: string) => { [key: string]: string }

type TParseDiscoveredPolicies = (data: any) => any
interface ISourceType {
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

  const createMessage = (
    data: any[],
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSourceStr: string,
    getSourceTextStr: string,
    parseStringMapStr: string,
    parseDiscoveredPoliciesStr: string
  ): any[] => {
    const resolveSource = eval(resolveSourceStr) as TResolveSource
    const getSourceText = eval(getSourceTextStr) as TGetSourceText
    const parseStringMap = eval(parseStringMapStr) as TParseStringMap
    const parseDiscoveredPolicies = eval(parseDiscoveredPoliciesStr) as TParseDiscoveredPolicies

    const policiesWithSource = (parseDiscoveredPolicies(data) as any[])?.map((policy: any): any => {
      return {
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
    })

    const groupByNameKindGroup: { [nameKindGroup: string]: any[] } = {}
    // Group by policy name, kind and apiGroup
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
      let responseAction = group[0].remediationAction
      let source = { ...group[0].source }

      for (const policy of group) {
        // Set to highest severity among grouped policies
        if (severityTable(policy.severity) > highestSeverity) {
          highestSeverity = severityTable(policy.severity)
        }

        if (policy.remediationAction != responseAction) {
          responseAction = 'inform/enforce'
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

      return {
        id: nameKindGroup,
        name: group[0].name,
        kind: group[0]?.kind,
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
