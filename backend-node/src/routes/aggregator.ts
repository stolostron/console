/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { notFound, unauthorized } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { paginate } from '../lib/pagination'
import {
  startAggregatingApplications,
  stopAggregatingApplications,
  polledApplicationAggregation,
  getApplications,
  filterApplications,
  sortApplications,
  addUIData,
} from './aggregators/applications'
import { requestAggregatedStatuses } from './aggregators/statuses'
import { requestAggregatedAppSetData } from './aggregators/appSetData'
import type { IResource } from '../resources/resource'
import type { IWatchOptions } from '../resources/watch-options'

export function startAggregating(): void {
  void startAggregatingApplications()
}

export function stopAggregating(): void {
  stopAggregatingApplications()
}

export async function polledAggregation(
  options: IWatchOptions,
  items: IResource[],
  shouldPostProcess: boolean
): Promise<void> {
  await polledApplicationAggregation(options, items, shouldPostProcess)
}

export async function aggregate(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return unauthorized(req, res)
  const type = req.url.split('?')[0].split('/')
  if (type.length < 3) return notFound(req, res)
  switch (type[2]) {
    case 'applications':
      return paginate(req, res, token, getApplications, filterApplications, sortApplications, addUIData)
    case 'statuses':
      return requestAggregatedStatuses(req, res, token, getApplications)
    case 'appSetData':
      return requestAggregatedAppSetData(req, res)
  }

  return notFound(req, res)
}
