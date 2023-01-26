/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { Provider, ProviderLongTextMap, ProviderIconMap } from '../'
import { AcmIcon } from '../../AcmIcons/AcmIcons'

const useStyles = makeStyles({
  container: {
    '& svg, & img': {
      width: '1.8em',
      height: '1.8em',
      margin: '-0.4em 0',
      top: '0.12em',
      position: 'relative',
    },
    whiteSpace: 'nowrap',
  },
})

export function AcmInlineProvider(props: { provider: Provider }) {
  const classes = useStyles()

  return (
    <div className={classes.container}>
      <AcmIcon icon={ProviderIconMap[props.provider]} />
      &nbsp; &nbsp;
      <span>{ProviderLongTextMap[props.provider]}</span>
    </div>
  )
}
