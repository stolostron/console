/* Copyright Contributors to the Open Cluster Management project */
import { PathParam, useParams } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../NavigationPath'
import KubevirtPluginWrapper from '../../Search/Details/KubevirtPluginWrapper'
import { PluginContext } from '../../../lib/PluginContext'
import { useContext } from 'react'

export default function VirtualMachineConsole() {
  const { cluster, ns } = useParams<PathParam<NavigationPath.virtualMachineConsole>>()
  const { acmExtensions: { ConsoleStandAlone } = {} } = useContext(PluginContext)
  return ConsoleStandAlone ? (
    <KubevirtPluginWrapper currentCluster={cluster} currentNamespace={ns}>
      <ConsoleStandAlone />
    </KubevirtPluginWrapper>
  ) : null
}
