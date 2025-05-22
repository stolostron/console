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
    data: any,
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSource: string,
    getSourceText: string,
    parseStringMap: string,
    parseDiscoveredPolicies: string
  ) => {
    policyItems: any[]
    relatedResources: any[]
    kyvernoPolicyReports: any[]
  }
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

  // related resources for policy types listed in search fields are minified
  const expandResource = (obj: any): any => {
    const { g: apigroup, v: apiversion, k: kind, ns: namespace, n: name } = obj
    const groupversion = apigroup ? apigroup + '/' + apiversion : apiversion
    return { apigroup, apiversion, groupversion, kind, namespace, name }
  }

  const createMessage = (
    data: any,
    helmReleases: any[],
    channels: any[],
    subscriptions: any[],
    resolveSourceStr: string,
    getSourceTextStr: string,
    parseStringMapStr: string,
    parseDiscoveredPoliciesStr: string
  ): {
    policyItems: any[]
    relatedResources: any[]
    kyvernoPolicyReports: any[]
  } => {
    let searchDataItems: any[] = []
    let kyvernoPolicyReports: any[] = []

    const resources = new Map() // keys like cluster:groupversion:kind:namespace:name
    let templateName = ''

    data?.searchResult?.forEach((result: any) => {
      searchDataItems = searchDataItems.concat(result?.items || [])

      const polInfo = result?.items?.[0] // useful for most template information
      templateName = polInfo?.namespace ? polInfo.namespace + '/' + polInfo?.name : polInfo?.name

      if (polInfo?.apigroup === 'kyverno.io') {
        result.related?.forEach((related: any) => {
          if (['PolicyReport', 'ClusterPolicyReport'].includes(related?.kind ?? ''))
            kyvernoPolicyReports = kyvernoPolicyReports.concat(related?.items || [])
        })
      }

      const templateNamespace = new Map()
      result?.items?.forEach((polItem: any) => {
        templateNamespace.set(polItem.cluster, polItem.namespace)
      })

      result?.related?.forEach((related: any) => {
        related?.items?.forEach((item: any) => {
          const { apigroup, apiversion, kind, cluster, namespace, name } = item
          const groupversion = apigroup ? apigroup + '/' + apiversion : apiversion

          // exclude these kinds
          switch (apigroup + ':' + kind) {
            case 'internal.open-cluster-management.io:Cluster':
            case 'policy.open-cluster-management.io:Policy':
            case 'policy.open-cluster-management.io:ConfigurationPolicy':
              return
            case 'wgpolicyk8s.io:PolicyReport':
            case 'wgpolicyk8s.io:ClusterPolicyReport':
              if (polInfo?.apigroup === 'kyverno.io') return
              break
          }

          item.compliant = 'compliant' // if it is noncompliant, it will be in _nonCompliantResources
          item.groupversion = groupversion
          item.templateInfo = {
            clusterName: cluster,
            apiVersion: polInfo?.apiversion,
            apiGroup: polInfo?.apigroup,
            kind: polInfo?.kind,
            templateName: polInfo?.name,
            templateNamespace: templateNamespace.get(cluster),
          }

          resources.set(`${cluster}:${groupversion}:${kind}:${namespace}:${name}`, item)
        })
      })

      result?.items?.forEach((polItem: any) => {
        const cluster = polItem?.cluster

        const missing = JSON.parse(polItem?._missingResources || '[]')
        missing?.forEach((miniObj: any) => {
          const obj = expandResource(miniObj)
          const key = `${cluster}:${obj.groupversion}:${obj.kind}:${obj.namespace}:${obj.name}`
          resources.set(key, {
            ...obj,
            cluster,
            compliant: 'compliant', // if it is noncompliant, it will also be in the _nonCompliantResources
            templateInfo: {
              clusterName: cluster,
              apiVersion: polInfo?.apiversion,
              apiGroup: polInfo?.apigroup,
              kind: polInfo?.kind,
              templateName: polInfo?.name,
              templateNamespace: templateNamespace.get(cluster),
            },
          })
        })

        const nonComp = JSON.parse(polItem?._nonCompliantResources || '[]')
        nonComp?.forEach((miniObj: any) => {
          const obj = expandResource(miniObj)
          const key = `${cluster}:${obj.groupversion}:${obj.kind}:${obj.namespace}:${obj.name}`
          if (resources.has(key)) {
            resources.get(key).compliant = 'noncompliant'
          }
        })
      })
    })

    const relatedResources = Array.from(resources.values())

    if (searchDataItems?.length === 0) {
      return {
        policyItems: [],
        relatedResources: [],
        kyvernoPolicyReports: [],
      }
    }

    const resolveSource = eval(resolveSourceStr) as TResolveSource
    const getSourceText = eval(getSourceTextStr) as TGetSourceText
    const parseStringMap = eval(parseStringMapStr) as TParseStringMap
    const parseDiscoveredPolicies = eval(parseDiscoveredPoliciesStr) as TParseDiscoveredPolicies

    const kyvernoViolationMap: { [policyNamespaceName: string]: number } = {}
    const reportMap: { [resourceUid: string]: any } = {}

    if (kyvernoPolicyReports.length > 0) {
      kyvernoPolicyReports.forEach((cr) => {
        // NOSONAR
        for (const violationMapValue of ((cr?._policyViolationCounts ?? '') as string).split('; ')) {
          const nsPolicyNameViolation = violationMapValue.split('=') ?? []
          const clusterNsPolicyName = cr.cluster + '/' + nsPolicyNameViolation[0] // eg 'local-cluster/require-labels'
          kyvernoViolationMap[clusterNsPolicyName] =
            (kyvernoViolationMap[clusterNsPolicyName] ?? 0) + Number(nsPolicyNameViolation[1])

          reportMap[cr.cluster + '/' + cr.name] = cr
        }
      })

      relatedResources.forEach((item) => {
        const report = reportMap[item._uid]
        if (report) {
          item.policyReport = report

          report?._policyViolationCounts.split('; ').forEach((violation: string) => {
            const violationInfo = violation.split('=', 2)
            if (violationInfo[0] === templateName && Number(violationInfo[1]) > 0) {
              item.compliant = 'noncompliant'
            }
          })
        }
      })
    }

    const policiesWithSource = (parseDiscoveredPolicies(searchDataItems) as any[])
      ?.filter(
        // Filter out ValidatingAdmissionPolicyBinding instances created by Gatekeeper and Kyverno.
        (policy: any): any =>
          !(
            policy.kind === 'ValidatingAdmissionPolicyBinding' &&
            ['Gatekeeper', 'Kyverno'].includes(policy?._ownedBy ?? '')
          )
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
          const nsName = policy.namespace ? policy.namespace + '/' + policy.name : policy.name
          const key = policy.cluster + '/' + nsName
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

    // NOSONAR
    const policyItems = keys.map((nameKindGroup) => {
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

    return {
      policyItems,
      relatedResources,
      kyvernoPolicyReports,
    }
  }

  self.onmessage = (e: MessageEvent<any>) => {
    const {
      data: searchData,
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
        searchData,
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
