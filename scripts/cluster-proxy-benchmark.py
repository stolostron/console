#!/usr/bin/env python3
"""
Cluster Proxy Benchmark Tool

Simulates the network workload of opening VM details pages in the ACM console,
measuring response time, failure rate, and latency against the cluster-proxy.

Supports two modes:
  - websocket: list + WebSocket watch (original behavior)
  - polling:   periodic GET requests (new behavior)

Requires: websocat (for WebSocket connections)
"""

import argparse
import json
import os
import signal
import ssl
import statistics
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import defaultdict
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Configurable constants – edit these to match your environment
# ---------------------------------------------------------------------------

VM_NAMES = [
    "centos-stream9-violet-panther-61",
    "fedora-magenta-aardwolf-87",
    "rhel8-emerald-fowl-29",
    "rhel9-indigo-gecko-63",
]

VM_NAMESPACE = "default"
MANAGED_CLUSTER = "virt-managed"
CSV_NAME = "kubevirt-hyperconverged-operator.v4.21.16"

DURATION_MINUTES = 15
POLL_INTERVAL_SECONDS = 10
WS_RECONNECT_SECONDS = 30
VM_LOAD_INTERVAL_SECONDS = 10
MAX_ACTIVE_SESSIONS = 10

# ---------------------------------------------------------------------------
# Resource definitions
# ---------------------------------------------------------------------------


@dataclass
class ResourceDef:
    """A Kubernetes resource to watch or fetch."""

    name: str
    api_path: str  # template with {ns}, {vm}, {csv_name} placeholders
    selector: str  # query-param string fragment, may contain {vm}/{csv_name}
    per_vm: bool  # True if the path/selector contains {vm}
    watch: bool = True  # False for one-time-only GETs


WATCHED_RESOURCES: list[ResourceDef] = [
    ResourceDef(
        "virtualmachines",
        "apis/kubevirt.io/v1/namespaces/{ns}/virtualmachines",
        "fieldSelector=metadata.name%3D{vm}",
        per_vm=True,
    ),
    ResourceDef(
        "virtualmachineinstances",
        "apis/kubevirt.io/v1/namespaces/{ns}/virtualmachineinstances",
        "fieldSelector=metadata.name%3D{vm}",
        per_vm=True,
    ),
    ResourceDef(
        "datavolumes",
        "apis/cdi.kubevirt.io/v1beta1/namespaces/{ns}/datavolumes",
        "fieldSelector=metadata.name%3D{vm}",
        per_vm=True,
    ),
    ResourceDef(
        "persistentvolumeclaims",
        "api/v1/namespaces/{ns}/persistentvolumeclaims",
        "fieldSelector=metadata.name%3D{vm}",
        per_vm=True,
    ),
    ResourceDef(
        "virtualmachineinstancemigrations",
        "apis/kubevirt.io/v1/namespaces/{ns}/virtualmachineinstancemigrations",
        "labelSelector=kubevirt.io%2Fvmi-name%3D{vm}",
        per_vm=True,
    ),
    ResourceDef(
        "pods",
        "api/v1/namespaces/{ns}/pods",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "services",
        "api/v1/namespaces/{ns}/services",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "nodes",
        "api/v1/nodes",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "dnses",
        "apis/config.openshift.io/v1/dnses",
        "fieldSelector=metadata.name%3Dcluster",
        per_vm=False,
    ),
    ResourceDef(
        "hyperconvergeds",
        "apis/hco.kubevirt.io/v1beta1/namespaces/openshift-cnv/hyperconvergeds",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "network-attachment-definitions",
        "apis/k8s.cni.cncf.io/v1/namespaces/{ns}/network-attachment-definitions",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "virtualmachinesnapshots",
        "apis/snapshot.kubevirt.io/v1alpha1/namespaces/{ns}/virtualmachinesnapshots",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "virtualmachinerestores",
        "apis/snapshot.kubevirt.io/v1beta1/namespaces/{ns}/virtualmachinerestores",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "multinamespacevmstoragemigrationplans",
        "apis/migrations.kubevirt.io/v1alpha1/namespaces/{ns}/multinamespacevirtualmachinestoragemigrationplans",
        "",
        per_vm=False,
    ),
    ResourceDef(
        "clusterserviceversions",
        "apis/operators.coreos.com/v1alpha1/namespaces/openshift-cnv/clusterserviceversions",
        "fieldSelector=metadata.name%3D{csv_name}",
        per_vm=False,
    ),
    ResourceDef(
        "subscriptions",
        "apis/operators.coreos.com/v1alpha1/namespaces/openshift-cnv/subscriptions",
        "",
        per_vm=False,
    ),
]

ONETIME_RESOURCES: list[ResourceDef] = [
    ResourceDef(
        "filesystemlist",
        "apis/subresources.kubevirt.io/v1/namespaces/{ns}/virtualmachineinstances/{vm}/filesystemlist",
        "",
        per_vm=True,
        watch=False,
    ),
    ResourceDef(
        "guestosinfo",
        "apis/subresources.kubevirt.io/v1/namespaces/{ns}/virtualmachineinstances/{vm}/guestosinfo",
        "",
        per_vm=True,
        watch=False,
    ),
]

VNC_RESOURCE = ResourceDef(
    "vnc",
    "apis/subresources.kubevirt.io/v1/namespaces/{ns}/virtualmachineinstances/{vm}/vnc",
    "",
    per_vm=True,
    watch=False,
)


def resolve_path(res: ResourceDef, vm_name: str) -> str:
    return res.api_path.format(ns=VM_NAMESPACE, vm=vm_name, csv_name=CSV_NAME)


def resolve_selector(res: ResourceDef, vm_name: str) -> str:
    return res.selector.format(vm=vm_name, csv_name=CSV_NAME)


def build_list_url(domain: str, res: ResourceDef, vm_name: str) -> str:
    path = resolve_path(res, vm_name)
    url = f"https://{domain}/{MANAGED_CLUSTER}/{path}"
    sel = resolve_selector(res, vm_name)
    if sel:
        url += f"?{sel}"
    return url


def build_watch_url(domain: str, res: ResourceDef, vm_name: str, resource_version: str) -> str:
    path = resolve_path(res, vm_name)
    url = f"wss://{domain}/{MANAGED_CLUSTER}/{path}"
    params = ["watch=true", f"resourceVersion={resource_version}", "allowWatchBookmarks=true"]
    sel = resolve_selector(res, vm_name)
    if sel:
        params.append(sel)
    url += "?" + "&".join(params)
    return url


def build_vnc_url(domain: str, vm_name: str) -> str:
    path = resolve_path(VNC_RESOURCE, vm_name)
    sel = resolve_selector(VNC_RESOURCE, vm_name)
    return f"wss://{domain}/{MANAGED_CLUSTER}/{path}?{sel}"


# ---------------------------------------------------------------------------
# Metrics collection
# ---------------------------------------------------------------------------


@dataclass
class HttpMetric:
    timestamp: float
    vm_name: str
    resource: str
    phase: str  # "list", "poll", "onetime"
    status_code: int
    response_time_ms: float
    response_size: int
    error: str


@dataclass
class WsMetric:
    vm_name: str
    resource: str
    connected_at: float
    disconnected_at: float | None = None
    messages_received: int = 0
    error: str = ""


class MetricsCollector:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.http_metrics: list[HttpMetric] = []
        self.ws_metrics: list[WsMetric] = []

    def record_http(self, m: HttpMetric) -> None:
        with self._lock:
            self.http_metrics.append(m)

    def record_ws(self, m: WsMetric) -> None:
        with self._lock:
            self.ws_metrics.append(m)

    def update_ws(self, m: WsMetric, **kwargs) -> None:
        with self._lock:
            for k, v in kwargs.items():
                setattr(m, k, v)

    # -- aggregation --

    def http_summary(self) -> dict:
        with self._lock:
            metrics = list(self.http_metrics)

        if not metrics:
            return {"total": 0}

        times = [m.response_time_ms for m in metrics]
        successes = [m for m in metrics if 200 <= m.status_code < 400]
        failures = [m for m in metrics if m.status_code < 200 or m.status_code >= 400]
        status_dist: dict[int, int] = defaultdict(int)
        for m in metrics:
            status_dist[m.status_code] += 1

        pct = lambda lst, p: sorted(lst)[int(len(lst) * p / 100)] if lst else 0

        return {
            "total": len(metrics),
            "success": len(successes),
            "failed": len(failures),
            "success_pct": round(len(successes) / len(metrics) * 100, 1),
            "response_time_ms": {
                "min": round(min(times), 1),
                "avg": round(statistics.mean(times), 1),
                "p50": round(pct(times, 50), 1),
                "p95": round(pct(times, 95), 1),
                "p99": round(pct(times, 99), 1),
                "max": round(max(times), 1),
            },
            "status_codes": dict(sorted(status_dist.items())),
        }

    def ws_summary(self) -> dict:
        with self._lock:
            metrics = list(self.ws_metrics)

        if not metrics:
            return {"total": 0}

        alive = [m for m in metrics if m.disconnected_at is None]
        failed = [m for m in metrics if m.error]
        succeeded = [m for m in metrics if not m.error]
        total_messages = sum(m.messages_received for m in metrics)
        durations = []
        for m in metrics:
            end = m.disconnected_at or time.time()
            durations.append(end - m.connected_at)

        return {
            "total": len(metrics),
            "success": len(succeeded),
            "failed": len(failed),
            "still_alive": len(alive),
            "disconnected": len(metrics) - len(alive),
            "total_messages": total_messages,
            "duration_seconds": {
                "min": round(min(durations), 1) if durations else 0,
                "avg": round(statistics.mean(durations), 1) if durations else 0,
                "max": round(max(durations), 1) if durations else 0,
            },
        }

    def to_json(self) -> dict:
        with self._lock:
            http = [
                {
                    "timestamp": m.timestamp,
                    "vm": m.vm_name,
                    "resource": m.resource,
                    "phase": m.phase,
                    "status": m.status_code,
                    "time_ms": round(m.response_time_ms, 1),
                    "size": m.response_size,
                    "error": m.error,
                }
                for m in self.http_metrics
            ]
            ws = [
                {
                    "vm": m.vm_name,
                    "resource": m.resource,
                    "connected_at": m.connected_at,
                    "disconnected_at": m.disconnected_at,
                    "messages": m.messages_received,
                    "error": m.error,
                }
                for m in self.ws_metrics
            ]
        return {"http": http, "ws": ws}


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


def http_get(
    url: str,
    token: str,
    vm_name: str,
    resource: str,
    phase: str,
    collector: MetricsCollector,
    stop_event: threading.Event,
) -> tuple[int, str]:
    """
    Perform a GET request, record metrics, and return (status_code, body).
    Returns (0, "") on connection error.  Sets stop_event on 401/403.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    req = urllib.request.Request(url, headers=headers, method="GET")

    start = time.time()
    status = 0
    body = ""
    size = 0
    error = ""

    try:
        with urllib.request.urlopen(req, context=_ssl_ctx, timeout=30) as resp:
            status = resp.status
            raw = resp.read()
            body = raw.decode("utf-8", errors="replace")
            size = len(raw)
    except urllib.error.HTTPError as e:
        status = e.code
        error = str(e.reason)
        try:
            body = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
    except Exception as e:
        error = str(e)

    elapsed = (time.time() - start) * 1000

    collector.record_http(
        HttpMetric(
            timestamp=start,
            vm_name=vm_name,
            resource=resource,
            phase=phase,
            status_code=status,
            response_time_ms=elapsed,
            response_size=size,
            error=error,
        )
    )

    if status in (401, 403):
        print(f"\n[TOKEN EXPIRED] Got {status} for {resource} – stopping all threads.")
        stop_event.set()

    return status, body


# ---------------------------------------------------------------------------
# WebSocket helpers (websocat)
# ---------------------------------------------------------------------------

WEBSOCAT_BIN = "websocat"


def find_websocat() -> str:
    for candidate in [WEBSOCAT_BIN, "/opt/homebrew/bin/websocat", "/usr/local/bin/websocat"]:
        try:
            subprocess.run([candidate, "--version"], capture_output=True, check=True)
            return candidate
        except (FileNotFoundError, subprocess.CalledProcessError):
            continue
    print("ERROR: websocat not found. Install it: brew install websocat", file=sys.stderr)
    sys.exit(1)


def start_websocat(
    websocat: str,
    url: str,
    token: str,
    domain: str,
    vm_name: str,
    resource: str,
    collector: MetricsCollector,
    stop_event: threading.Event,
    is_binary: bool = False,
) -> tuple[subprocess.Popen, WsMetric]:
    """Start a websocat process and a reader thread to count messages."""
    mode_flag = "-b" if is_binary else "-t"
    cmd = [
        websocat,
        mode_flag,
        "--no-close",
        "-k",
        "--websocket-version", "13",
        f"--header=Authorization: Bearer {token}",
        url,
    ]
    if not is_binary:
        cmd[-1:-1] = [
            "--header=Sec-Fetch-Dest: empty",
            "--header=Sec-Fetch-Mode: websocket",
            "--header=Sec-Fetch-Site: same-origin",
            f"--origin=https://{domain}",
        ]

    if os.environ.get("BENCHMARK_DEBUG"):
        safe_cmd = [c if "Bearer" not in c else "--header=Authorization: Bearer <REDACTED>" for c in cmd]
        print(f"  [DEBUG] {' '.join(safe_cmd)}")

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    ws_metric = WsMetric(
        vm_name=vm_name,
        resource=resource,
        connected_at=time.time(),
    )
    collector.record_ws(ws_metric)

    def reader():
        try:
            while not stop_event.is_set():
                chunk = proc.stdout.read(4096)
                if not chunk:
                    break
                collector.update_ws(ws_metric, messages_received=ws_metric.messages_received + 1)
        except Exception:
            pass
        finally:
            collector.update_ws(ws_metric, disconnected_at=time.time())

    def stderr_reader():
        try:
            err_output = proc.stderr.read()
            if err_output:
                err_text = err_output.decode("utf-8", errors="replace").strip()
                if err_text:
                    collector.update_ws(ws_metric, error=err_text[:200])
                    # Print early failures to help debug connection issues
                    elapsed = time.time() - ws_metric.connected_at
                    if elapsed < 5:
                        print(f"  [WS ERROR] {vm_name}/{resource} ({elapsed:.1f}s): {err_text[:120]}")
        except Exception:
            pass

    t1 = threading.Thread(target=reader, daemon=True)
    t1.start()
    t2 = threading.Thread(target=stderr_reader, daemon=True)
    t2.start()

    return proc, ws_metric


# ---------------------------------------------------------------------------
# WebSocket mode
# ---------------------------------------------------------------------------


def extract_resource_version(body: str) -> str:
    try:
        data = json.loads(body)
        rv = data.get("metadata", {}).get("resourceVersion", "")
        if rv:
            return rv
        items = data.get("items")
        if isinstance(items, list) and items:
            return items[-1].get("metadata", {}).get("resourceVersion", "")
    except (json.JSONDecodeError, AttributeError):
        pass
    return ""


@dataclass
class VmSession:
    """Tracks one VM details-page session and its websocat processes."""

    vm_name: str
    stop_event: threading.Event
    thread: threading.Thread | None = None
    processes: list = field(default_factory=list)
    lock: threading.Lock = field(default_factory=threading.Lock)
    started_at: float = 0.0

    def shutdown(self) -> None:
        self.stop_event.set()
        with self.lock:
            for proc in self.processes:
                try:
                    proc.terminate()
                except OSError:
                    pass
        if self.thread:
            self.thread.join(timeout=5)
        with self.lock:
            for proc in self.processes:
                try:
                    proc.kill()
                except OSError:
                    pass


def run_websocket_session(
    vm_name: str,
    domain: str,
    token: str,
    websocat: str,
    collector: MetricsCollector,
    session_stop: threading.Event,
    global_stop: threading.Event,
    session: VmSession,
) -> None:
    """
    Run the websocket-mode workload for a single VM session.

    The original UI re-opens every watch WebSocket every 30 seconds (list then
    watch cycle) because it cannot detect dead connections.  VNC stays open
    for the lifetime of the session.
    """

    def stopped() -> bool:
        return session_stop.is_set() or global_stop.is_set()

    # One-time GETs (filesystemlist, guestosinfo)
    for res in ONETIME_RESOURCES:
        if stopped():
            return
        url = build_list_url(domain, res, vm_name)
        http_get(url, token, vm_name, res.name, "onetime", collector, global_stop)

    # VNC WebSocket – stays open for the session lifetime
    if not stopped():
        vnc_url = build_vnc_url(domain, vm_name)
        proc, _ = start_websocat(
            websocat, vnc_url, token, domain, vm_name, "vnc", collector, global_stop, is_binary=True
        )
        with session.lock:
            session.processes.append(proc)

    # Repeated list+watch cycle every WS_RECONNECT_SECONDS
    while not stopped():
        resource_versions: dict[str, str] = {}
        for res in WATCHED_RESOURCES:
            if stopped():
                return
            url = build_list_url(domain, res, vm_name)
            status, body = http_get(url, token, vm_name, res.name, "list", collector, global_stop)
            if 200 <= status < 400:
                resource_versions[res.name] = extract_resource_version(body)

        cycle_procs: list[subprocess.Popen] = []
        for res in WATCHED_RESOURCES:
            if stopped():
                break
            rv = resource_versions.get(res.name, "")
            ws_url = build_watch_url(domain, res, vm_name, rv)
            proc, _ = start_websocat(
                websocat, ws_url, token, domain, vm_name, res.name, collector, global_stop
            )
            cycle_procs.append(proc)

        with session.lock:
            session.processes.extend(cycle_procs)

        # Hold the watches open for WS_RECONNECT_SECONDS, then tear down
        session_stop.wait(WS_RECONNECT_SECONDS)

        for proc in cycle_procs:
            try:
                proc.terminate()
            except OSError:
                pass


def websocket_orchestrator(
    domain: str,
    token: str,
    load_interval: int,
    websocat: str,
    collector: MetricsCollector,
    global_stop: threading.Event,
) -> None:
    """
    Cycle through VMs, loading a new session every load_interval seconds.
    Keeps at most MAX_ACTIVE_SESSIONS sessions alive, evicting the oldest.
    """
    import itertools

    active_sessions: list[VmSession] = []
    vm_cycle = itertools.cycle(VM_NAMES)

    while not global_stop.is_set():
        # Evict the oldest session if at capacity
        if len(active_sessions) >= MAX_ACTIVE_SESSIONS:
            oldest = active_sessions.pop(0)
            print(f"  [{oldest.vm_name}] Closing session (age {int(time.time() - oldest.started_at)}s)")
            oldest.shutdown()

        vm_name = next(vm_cycle)
        session = VmSession(vm_name=vm_name, stop_event=threading.Event(), started_at=time.time())
        session.thread = threading.Thread(
            target=run_websocket_session,
            args=(vm_name, domain, token, websocat, collector, session.stop_event, global_stop, session),
            daemon=True,
        )
        session.thread.start()
        active_sessions.append(session)
        print(f"  [{vm_name}] Opening session ({len(active_sessions)}/{MAX_ACTIVE_SESSIONS} active)")

        global_stop.wait(load_interval)

    # Shut down all remaining sessions
    for s in active_sessions:
        s.shutdown()


# ---------------------------------------------------------------------------
# Polling mode
# ---------------------------------------------------------------------------


def run_polling_session(
    vm_name: str,
    domain: str,
    token: str,
    poll_interval: int,
    websocat: str,
    collector: MetricsCollector,
    session_stop: threading.Event,
    global_stop: threading.Event,
    session: VmSession,
) -> None:
    """Run the polling-mode workload for a single VM session."""

    def stopped() -> bool:
        return session_stop.is_set() or global_stop.is_set()

    # Initial fetch for all resources
    all_initial = list(WATCHED_RESOURCES) + list(ONETIME_RESOURCES)
    for res in all_initial:
        if stopped():
            return
        url = build_list_url(domain, res, vm_name)
        phase = "list" if res.watch else "onetime"
        http_get(url, token, vm_name, res.name, phase, collector, global_stop)

    # VNC WebSocket
    if not stopped():
        vnc_url = build_vnc_url(domain, vm_name)
        proc, _ = start_websocat(
            websocat, vnc_url, token, domain, vm_name, "vnc", collector, global_stop, is_binary=True
        )
        with session.lock:
            session.processes.append(proc)

    # Poll loop
    while not stopped():
        session_stop.wait(poll_interval)
        if stopped():
            break
        for res in WATCHED_RESOURCES:
            if stopped():
                break
            url = build_list_url(domain, res, vm_name)
            http_get(url, token, vm_name, res.name, "poll", collector, global_stop)


def polling_orchestrator(
    domain: str,
    token: str,
    poll_interval: int,
    load_interval: int,
    websocat: str,
    collector: MetricsCollector,
    global_stop: threading.Event,
) -> None:
    """
    Cycle through VMs in polling mode, loading a new session every
    load_interval seconds.  Keeps at most MAX_ACTIVE_SESSIONS sessions alive.
    """
    import itertools

    active_sessions: list[VmSession] = []
    vm_cycle = itertools.cycle(VM_NAMES)

    while not global_stop.is_set():
        if len(active_sessions) >= MAX_ACTIVE_SESSIONS:
            oldest = active_sessions.pop(0)
            print(f"  [{oldest.vm_name}] Closing session (age {int(time.time() - oldest.started_at)}s)")
            oldest.shutdown()

        vm_name = next(vm_cycle)
        session = VmSession(vm_name=vm_name, stop_event=threading.Event(), started_at=time.time())
        session.thread = threading.Thread(
            target=run_polling_session,
            args=(vm_name, domain, token, poll_interval, websocat, collector,
                  session.stop_event, global_stop, session),
            daemon=True,
        )
        session.thread.start()
        active_sessions.append(session)
        print(f"  [{vm_name}] Opening session ({len(active_sessions)}/{MAX_ACTIVE_SESSIONS} active)")

        global_stop.wait(load_interval)

    for s in active_sessions:
        s.shutdown()


# ---------------------------------------------------------------------------
# Progress & summary output
# ---------------------------------------------------------------------------

PROGRESS_INTERVAL = 10


def progress_reporter(
    collector: MetricsCollector,
    stop_event: threading.Event,
    start_time: float,
) -> None:
    while not stop_event.is_set():
        stop_event.wait(PROGRESS_INTERVAL)
        if stop_event.is_set():
            break
        elapsed = time.time() - start_time
        hs = collector.http_summary()
        ws = collector.ws_summary()
        total = hs.get("total", 0)
        failed = hs.get("failed", 0)
        avg_ms = hs.get("response_time_ms", {}).get("avg", 0)
        ws_alive = ws.get("still_alive", 0)
        ws_total = ws.get("total", 0)
        ws_failed = ws.get("failed", 0)
        mins, secs = divmod(int(elapsed), 60)
        print(
            f"  [{mins}m{secs:02d}s] HTTP: {total} reqs ({failed} failed, avg {avg_ms:.0f}ms) "
            f"| WS: {ws_alive}/{ws_total} alive, {ws_failed} failed"
        )


def print_summary(
    mode: str,
    poll_interval: int,
    duration_actual: float,
    vm_count: int,
    collector: MetricsCollector,
) -> None:
    hs = collector.http_summary()
    ws = collector.ws_summary()
    mins, secs = divmod(int(duration_actual), 60)

    if mode == "websocket":
        mode_label = f"websocket (list+watch every {WS_RECONNECT_SECONDS}s)"
    else:
        mode_label = f"polling ({poll_interval}s interval)"

    print("\n" + "=" * 50)
    print("  Benchmark Results")
    print("=" * 50)
    print(f"  Mode:     {mode_label}")
    print(f"  Duration: {mins}m {secs}s")
    print(f"  VMs:      {vm_count}")

    if hs["total"] > 0:
        print(f"\n  HTTP Requests:")
        print(f"    Total:   {hs['total']}")
        print(f"    Success: {hs['success']} ({hs['success_pct']}%)")
        print(f"    Failed:  {hs['failed']} ({round(100 - hs['success_pct'], 1)}%)")
        rt = hs["response_time_ms"]
        print(f"    Response Time (ms):")
        print(f"      min: {rt['min']}  avg: {rt['avg']}  p50: {rt['p50']}  p95: {rt['p95']}  p99: {rt['p99']}  max: {rt['max']}")
        print(f"    Status Codes: {hs['status_codes']}")
    else:
        print("\n  HTTP Requests: (none)")

    if ws["total"] > 0:
        ws_label = "VNC only" if mode == "polling" else "watches + VNC"
        print(f"\n  WebSocket Connections ({ws_label}):")
        print(f"    Opened:         {ws['total']}")
        print(f"    Success:        {ws['success']}")
        print(f"    Failed:         {ws['failed']}")
        print(f"    Still alive:    {ws['still_alive']}")
        print(f"    Total messages: {ws['total_messages']}")
        dur = ws["duration_seconds"]
        print(f"    Duration (s):   min={dur['min']}  avg={dur['avg']}  max={dur['max']}")
    else:
        print("\n  WebSocket Connections: (none)")

    print("=" * 50)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark the ACM cluster-proxy by simulating VM details page workloads.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --mode polling --domain cluster-proxy-user.apps.example.com --token "$(oc whoami -t)" --duration 5
  %(prog)s --mode websocket --domain cluster-proxy-user.apps.example.com --token "$(oc whoami -t)" --duration 5
  %(prog)s --mode polling --domain cluster-proxy-user.apps.example.com --token "$(oc whoami -t)" --poll-interval 5 --output results.json
""",
    )
    parser.add_argument("--mode", required=True, choices=["websocket", "polling"], help="Benchmark mode")
    parser.add_argument("--domain", required=True, help="Cluster-proxy route hostname (e.g. cluster-proxy-user.apps.example.com)")
    parser.add_argument("--token", required=True, help="Bearer token for authentication (e.g. from 'oc whoami -t')")
    parser.add_argument("--duration", type=int, default=DURATION_MINUTES, help=f"Duration in minutes (default: {DURATION_MINUTES})")
    parser.add_argument("--poll-interval", type=int, default=POLL_INTERVAL_SECONDS, help=f"Polling interval in seconds, polling mode only (default: {POLL_INTERVAL_SECONDS})")
    parser.add_argument("--load-interval", type=int, default=VM_LOAD_INTERVAL_SECONDS, help=f"Seconds between loading each VM session (default: {VM_LOAD_INTERVAL_SECONDS})")
    parser.add_argument("--output", help="Path for detailed JSON results file")

    args = parser.parse_args()

    websocat = find_websocat()
    print(f"Using websocat: {websocat}")

    collector = MetricsCollector()
    stop_event = threading.Event()

    resources_per_vm = len(WATCHED_RESOURCES) + len(ONETIME_RESOURCES) + 1  # +1 for VNC

    print(f"\nCluster Proxy Benchmark")
    print(f"  Mode:          {args.mode}")
    print(f"  Domain:        {args.domain}")
    print(f"  VMs:           {len(VM_NAMES)} (cycling)")
    print(f"  Resources/VM:  {resources_per_vm} initial GETs")
    if args.mode == "websocket":
        ws_per_vm = len(WATCHED_RESOURCES) + 1
        print(f"  Watches/VM:    {ws_per_vm} WebSocket connections (re-opened every {WS_RECONNECT_SECONDS}s)")
    else:
        print(f"  Poll interval: {args.poll_interval}s")
        print(f"  VNC/VM:        1 WebSocket connection")
    print(f"  Load interval: {args.load_interval}s between new VM sessions")
    print(f"  Max active:    {MAX_ACTIVE_SESSIONS} concurrent sessions")
    print(f"  Duration:      {args.duration}m")
    print()

    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\n[INTERRUPTED] Shutting down...")
        stop_event.set()

    signal.signal(signal.SIGINT, signal_handler)

    start_time = time.time()

    # Start progress reporter
    progress_thread = threading.Thread(
        target=progress_reporter, args=(collector, stop_event, start_time), daemon=True
    )
    progress_thread.start()

    if args.mode == "websocket":
        orchestrator_target = websocket_orchestrator
        orchestrator_args = (
            args.domain, args.token, args.load_interval,
            websocat, collector, stop_event,
        )
    else:
        orchestrator_target = polling_orchestrator
        orchestrator_args = (
            args.domain, args.token, args.poll_interval, args.load_interval,
            websocat, collector, stop_event,
        )

    orchestrator_thread = threading.Thread(
        target=orchestrator_target, args=orchestrator_args, daemon=True,
    )
    orchestrator_thread.start()

    # Wait for duration or early stop
    stop_event.wait(args.duration * 60)
    stop_event.set()

    orchestrator_thread.join(timeout=15)

    duration_actual = time.time() - start_time
    print_summary(args.mode, args.poll_interval, duration_actual, len(VM_NAMES), collector)

    if args.output:
        results = {
            "config": {
                "mode": args.mode,
                "domain": args.domain,
                "vms": VM_NAMES,
                "namespace": VM_NAMESPACE,
                "cluster": MANAGED_CLUSTER,
                "duration_minutes": args.duration,
                "poll_interval_seconds": args.poll_interval,
                "load_interval_seconds": args.load_interval,
            },
            "summary": {
                "http": collector.http_summary(),
                "ws": collector.ws_summary(),
                "duration_actual_seconds": round(duration_actual, 1),
            },
            "data": collector.to_json(),
        }
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n  Detailed results written to: {args.output}")


if __name__ == "__main__":
    main()
