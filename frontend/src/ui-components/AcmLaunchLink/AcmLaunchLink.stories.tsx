/* Copyright Contributors to the Open Cluster Management project */

import { AcmLaunchLink, LaunchLink } from './AcmLaunchLink'
import RedHatIcon from '../AcmIcons/RedHatIcon'

export default {
  title: 'LaunchLink',
  component: AcmLaunchLink,
  argtypes: {
    count: {
      control: {
        type: 'range',
        options: {
          min: 0,
          max: 5,
        },
      },
    },
  },
}

export const DynamicLaunchLink = (args: any) => {
  const links: LaunchLink[] = [
    { id: 'grafana', text: 'Grafana', href: '/grafana' },
    { id: 'logs', text: 'Kibana', href: '/kibana' },
    { id: 'cloud-pak', text: 'IBM CP4MCM', href: 'https://www.ibm.com' },
    { id: 'cloud-pak-no-icon', text: 'IBM CP4MCM no icon', href: 'https://www.ibm.com', noIcon: true },
    { id: 'redhat', text: 'RedHat icon', href: 'https://www.redhat.com/', noIcon: false, icon: <RedHatIcon /> },
  ]

  const displayLinks = links.slice(0, args.count)

  return <AcmLaunchLink links={displayLinks} />
}
DynamicLaunchLink.args = { count: 5 }
