/* Copyright Contributors to the Open Cluster Management project */

import React, { useState } from 'react'

import { Button, FormSelect, FormSelectOption, Grid, GridItem } from '@patternfly/react-core'
import { useTranslation } from '~/lib/acm-i18next'

const MIRROR_ROSA_LATEST = 'https://mirror.openshift.com/pub/cgw/rosa/latest'

const operatingSystems = {
  linux: 'linux',
  mac: 'mac',
  windows: 'windows',
} as const

type OperatingSystem = (typeof operatingSystems)[keyof typeof operatingSystems]

const operatingSystemOptions: { value: OperatingSystem; label: string }[] = [
  { value: operatingSystems.linux, label: 'Linux' },
  { value: operatingSystems.mac, label: 'MacOS' },
  { value: operatingSystems.windows, label: 'Windows' },
]

const rosaDownloadUrls: Record<OperatingSystem, string> = {
  [operatingSystems.linux]: `${MIRROR_ROSA_LATEST}/rosa-linux.tar.gz`,
  [operatingSystems.mac]: `${MIRROR_ROSA_LATEST}/rosa-macosx.tar.gz`,
  [operatingSystems.windows]: `${MIRROR_ROSA_LATEST}/rosa-windows.zip`,
}

const detectOS = (): OperatingSystem => {
  const { platform } = window.navigator
  const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']

  if (macPlatforms.includes(platform)) {
    return operatingSystems.mac
  }
  if (windowsPlatforms.includes(platform)) {
    return operatingSystems.windows
  }
  return operatingSystems.linux
}

export interface RosaDownloadProps {
  /** Optional callback for analytics tracking */
  onDownloadClick?: (url: string, os: OperatingSystem) => void
}

const DownloadAndOSSelection: React.FC<RosaDownloadProps> = ({ onDownloadClick }) => {
  const [t] = useTranslation()
  const [selectedOS, setSelectedOS] = useState<OperatingSystem>(detectOS())

  const handleOSChange = (_event: React.FormEvent<HTMLSelectElement>, value: string): void => {
    setSelectedOS(value as OperatingSystem)
  }

  const downloadUrl = rosaDownloadUrls[selectedOS]

  const handleDownloadClick = (): void => {
    onDownloadClick?.(downloadUrl, selectedOS)
  }

  return (
    <Grid hasGutter className="os-based-download">
      <GridItem md={4}>
        <FormSelect
          value={selectedOS}
          onChange={handleOSChange}
          aria-label={t('Select operating system')}
          data-testid="os-dropdown-rosa"
        >
          {operatingSystemOptions.map(({ value, label }) => (
            <FormSelectOption key={value} value={value} label={label} />
          ))}
        </FormSelect>
      </GridItem>
      <GridItem md={5}>
        <Button component="a" href={downloadUrl} variant="secondary" download onClick={handleDownloadClick}>
          {t('Download the ROSA CLI')}
        </Button>
      </GridItem>
    </Grid>
  )
}

export default DownloadAndOSSelection
