/* Copyright Contributors to the Open Cluster Management project */

import { AcmTable, AcmTableProps } from '../../../ui-components/AcmTable'
import './AcmTable.css'
export function AcmTableWithEngine<T>(props: AcmTableProps<T>) {
  return <AcmTable<T> {...props} />
}
