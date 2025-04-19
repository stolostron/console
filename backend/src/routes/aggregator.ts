/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { notFound, unauthorized } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { paginate } from '../lib/pagination'
import {
  startAggregatingApplications,
  stopAggregatingApplications,
  polledApplicationAggregation,
  getApplications,
  filterApplications,
  addUIData,
} from './aggregators/applications'
import { requestAggregatedStatuses } from './aggregators/statuses'
import { requestAggregatedUIData } from './aggregators/uidata'
import { IResource } from '../resources/resource'
import { IWatchOptions } from './events'

export function startAggregating(): void {
  void startAggregatingApplications()
}

export function stopAggregating(): void {
  stopAggregatingApplications()
}

export function polledAggregation(options: IWatchOptions, items: IResource[], shouldPostProcess: boolean): void {
  polledApplicationAggregation(options, items, shouldPostProcess)
}

export async function aggregate(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return unauthorized(req, res)
  const type = req.url.split('?')[0].split('/')
  if (type.length < 3) return notFound(req, res)
  switch (type[2]) {
    case 'applications':
      return paginate(req, res, token, getApplications, filterApplications, addUIData)
    case 'statuses':
      return requestAggregatedStatuses(req, res, token, getApplications)
    case 'uidata':
      return requestAggregatedUIData(req, res)
  }

  return notFound(req, res)
}
