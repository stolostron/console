/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { liveness } from './liveness'

// The kubelet uses readiness probes to know when a container is ready to start accepting traffic
export function readiness(req: Http2ServerRequest, res: Http2ServerResponse): void {
  liveness(req, res)
}
