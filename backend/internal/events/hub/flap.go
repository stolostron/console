// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"

	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	policyKind             = "Policy"
	rootPolicyLabel        = "policy.open-cluster-management.io/root-policy"
	clusterNameLabel       = "policy.open-cluster-management.io/cluster-name"
	defaultFlapThreshold   = 5
	defaultFlapWindow      = 60 * time.Second
	defaultFlapCooldown    = 60 * time.Second
	defaultFlapSettling    = 60 * time.Second
	flapTrackerTTL         = 12 * time.Hour
	defaultThrottlingCheck = 60 * time.Second

	rankOK            = 0
	rankPending       = 1
	rankNonCompliant  = 2
	recentHistoryScan = 2
)

type flapConfig struct {
	threshold int
	window    time.Duration
	cooldown  time.Duration
	settling  time.Duration
	ttl       time.Duration
	interval  time.Duration
}

func defaultFlapConfig() flapConfig {
	return flapConfig{
		threshold: envIntOr(os.Getenv("FLAP_THRESHOLD"), defaultFlapThreshold),
		window:    envMSOr(os.Getenv("FLAP_WINDOW_MS"), defaultFlapWindow),
		cooldown:  envMSOr(os.Getenv("FLAP_COOLDOWN_MS"), defaultFlapCooldown),
		settling:  envMSOr(os.Getenv("FLAP_SETTLING_MS"), defaultFlapSettling),
		ttl:       flapTrackerTTL,
		interval:  envMSOr(os.Getenv("THROTTLING_CHECK_INTERVAL"), defaultThrottlingCheck),
	}
}

func envIntOr(raw string, fallback int) int {
	n, err := strconv.Atoi(raw)
	if err != nil || n == 0 {
		return fallback
	}
	return n
}

func envMSOr(raw string, fallback time.Duration) time.Duration {
	n, err := strconv.Atoi(raw)
	if err != nil || n == 0 {
		return fallback
	}
	return time.Duration(n) * time.Millisecond
}

type flapEntry struct {
	timestamps  []time.Time
	lastCached  time.Time
	emerged     time.Time
	throttled   bool
	lastSpec    string
	hasSpec     bool
	object      map[string]any
	lastSent    map[string]any
	severe      map[string]any
	severeRank  int
	gvr         schema.GroupVersionResource
	trackedRoot bool
	rootKey     string
	cluster     string
}

type recoveredEvent struct {
	object map[string]any
	gvr    schema.GroupVersionResource
}

type flapState struct {
	mu        sync.Mutex
	entries   map[string]*flapEntry
	cfg       flapConfig
	now       func() time.Time
	rootObjs  map[string]map[string]any
	rootGVR   map[string]schema.GroupVersionResource
	rootBad   map[string]map[string]struct{}
	rootDirty map[string]struct{}
}

func newFlapState(cfg flapConfig) *flapState {
	if cfg.threshold <= 0 {
		cfg.threshold = defaultFlapThreshold
	}
	if cfg.window <= 0 {
		cfg.window = defaultFlapWindow
	}
	if cfg.cooldown <= 0 {
		cfg.cooldown = defaultFlapCooldown
	}
	if cfg.settling <= 0 {
		cfg.settling = defaultFlapSettling
	}
	if cfg.ttl <= 0 {
		cfg.ttl = flapTrackerTTL
	}
	if cfg.interval <= 0 {
		cfg.interval = defaultThrottlingCheck
	}
	return &flapState{
		entries:   map[string]*flapEntry{},
		cfg:       cfg,
		rootObjs:  map[string]map[string]any{},
		rootGVR:   map[string]schema.GroupVersionResource{},
		rootBad:   map[string]map[string]struct{}{},
		rootDirty: map[string]struct{}{},
	}
}

func (s *flapState) clock() time.Time {
	if s != nil && s.now != nil {
		return s.now()
	}
	return time.Now()
}

func flapKey(kind, namespace, name string) string {
	return kind + "/" + namespace + "/" + name
}

func kindNSName(obj map[string]any) (kind, namespace, name string) {
	kind, _ = obj["kind"].(string)
	meta, _ := obj["metadata"].(map[string]any)
	if meta == nil {
		return kind, "", ""
	}
	name, _ = meta["name"].(string)
	namespace, _ = meta["namespace"].(string)
	return kind, namespace, name
}

func replicatedRoot(obj map[string]any) (namespace, name string, ok bool) {
	meta, _ := obj["metadata"].(map[string]any)
	labels, _ := meta["labels"].(map[string]any)
	raw, _ := labels[rootPolicyLabel].(string)
	dot := strings.IndexByte(raw, '.')
	if dot <= 0 || dot >= len(raw)-1 {
		return "", "", false
	}
	return raw[:dot], raw[dot+1:], true
}

func clusterOf(obj map[string]any) string {
	_, namespace, _ := kindNSName(obj)
	meta, _ := obj["metadata"].(map[string]any)
	labels, _ := meta["labels"].(map[string]any)
	if cluster, _ := labels[clusterNameLabel].(string); cluster != "" {
		return cluster
	}
	return namespace
}

func rankOfCompliant(value any) int {
	text, _ := value.(string)
	switch text {
	case "NonCompliant":
		return rankNonCompliant
	case "Pending":
		return rankPending
	default:
		return rankOK
	}
}

func violationRank(obj map[string]any) int {
	status, _ := obj["status"].(map[string]any)
	if status == nil {
		return rankOK
	}
	rank := rankOfCompliant(status["compliant"])
	if list, ok := status["status"].([]any); ok {
		for _, item := range list {
			entry, _ := item.(map[string]any)
			if next := rankOfCompliant(entry["compliant"]); next > rank {
				rank = next
			}
		}
	}
	if rank < rankNonCompliant && historyViolation(status) {
		rank = rankNonCompliant
	}
	return rank
}

func historyViolation(status map[string]any) bool {
	details, _ := status["details"].([]any)
	for _, detail := range details {
		entry, _ := detail.(map[string]any)
		if rankOfCompliant(entry["compliant"]) >= rankNonCompliant {
			return true
		}
		history, _ := entry["history"].([]any)
		n := len(history)
		if n > recentHistoryScan {
			n = recentHistoryScan
		}
		for i := 0; i < n; i++ {
			item, _ := history[i].(map[string]any)
			message, _ := item["message"].(string)
			if strings.HasPrefix(message, "NonCompliant") {
				return true
			}
		}
	}
	return false
}

func projectViolation(obj map[string]any) {
	status, _ := obj["status"].(map[string]any)
	if status == nil {
		status = map[string]any{}
		obj["status"] = status
	}
	status["compliant"] = "NonCompliant"
	list, _ := status["status"].([]any)
	for _, item := range list {
		entry, ok := item.(map[string]any)
		if ok {
			entry["compliant"] = "NonCompliant"
		}
	}
}

func copyClusters(in map[string]struct{}) map[string]struct{} {
	if len(in) == 0 {
		return nil
	}
	out := make(map[string]struct{}, len(in))
	for cluster := range in {
		out[cluster] = struct{}{}
	}
	return out
}

func projectRootClusters(obj map[string]any, clusters map[string]struct{}) {
	if obj == nil || len(clusters) == 0 {
		return
	}
	status, _ := obj["status"].(map[string]any)
	if status == nil {
		status = map[string]any{}
		obj["status"] = status
	}
	status["compliant"] = "NonCompliant"
	var list []any
	if raw, ok := status["status"].([]any); ok {
		list = raw
	}
	seen := map[string]bool{}
	for _, item := range list {
		entry, ok := item.(map[string]any)
		if !ok {
			continue
		}
		cluster, _ := entry["clustername"].(string)
		if _, want := clusters[cluster]; !want {
			continue
		}
		entry["compliant"] = "NonCompliant"
		seen[cluster] = true
	}
	for cluster := range clusters {
		if seen[cluster] {
			continue
		}
		list = append(list, map[string]any{
			"clustername":      cluster,
			"clusternamespace": cluster,
			"compliant":        "NonCompliant",
		})
	}
	status["status"] = list
}

func copyStatus(dst, src map[string]any) {
	status, ok := src["status"]
	if !ok || dst == nil {
		return
	}
	raw, err := json.Marshal(status)
	if err != nil {
		return
	}
	var copied any
	if json.Unmarshal(raw, &copied) == nil {
		dst["status"] = copied
	}
}

func specKey(obj map[string]any) string {
	spec := obj["spec"]
	if spec == nil {
		spec = map[string]any{}
	}
	raw, err := json.Marshal(spec)
	if err != nil {
		return "{}"
	}
	return string(raw)
}

func formatFlappingMessage(kind, namespace, name string, cfg flapConfig) string {
	windowMinutes := int(math.Max(1, math.Round(cfg.window.Minutes())))
	timesPerMinute := int(math.Max(1, math.Round(float64(time.Minute)/float64(cfg.cooldown))))
	return fmt.Sprintf(
		"%s %s in namespace %s has been modified more than %d times in the last %d minutes. Verify this resource is configured correctly. Updates are being limited to %d times per minute.",
		kind, name, namespace, cfg.threshold, windowMinutes, timesPerMinute,
	)
}

func formatFlappingRecoveredMessage(kind, namespace, name string) string {
	return fmt.Sprintf("%s %s in namespace %s is no longer being throttled; policy updates will resume normally.", kind, name, namespace)
}

// shouldThrottle reports whether this Policy update should skip SSE fan-out.
// Non-Policy kinds always return false. When false and the Policy is flapping, obj.throttled is set.
func (s *flapState) shouldThrottle(obj map[string]any, now time.Time, gvr schema.GroupVersionResource) bool {
	if s == nil || obj == nil {
		return false
	}
	kind, namespace, name := kindNSName(obj)
	if kind != policyKind {
		return false
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	key := flapKey(kind, namespace, name)
	entry := s.entries[key]
	if entry == nil {
		entry = &flapEntry{emerged: now}
		s.entries[key] = entry
	}

	if rns, rname, ok := replicatedRoot(obj); ok {
		entry.trackedRoot = true
		entry.rootKey = rns + "/" + rname
		entry.cluster = clusterOf(obj)
	}

	spec := specKey(obj)
	if entry.hasSpec && entry.lastSpec != spec {
		s.releaseRootLocked(entry)
		entry.object = nil
		entry.lastSent = nil
		entry.severe = nil
		entry.severeRank = 0
		entry.throttled = false
		entry.hasSpec = false
		entry.lastSpec = ""
		return false
	}

	entry.timestamps = append(entry.timestamps, now)
	n := 0
	for _, ts := range entry.timestamps {
		if now.Sub(ts) <= s.cfg.window {
			entry.timestamps[n] = ts
			n++
		}
	}
	entry.timestamps = entry.timestamps[:n]

	rank := violationRank(obj)
	if len(entry.timestamps) > s.cfg.threshold && now.Sub(entry.emerged) > s.cfg.settling {
		if !entry.throttled {
			applog.Logger().Warn(formatFlappingMessage(kind, namespace, name, s.cfg))
		}
		// Recovery republishes the apiserver object, without the console-only flag.
		entry.object = runtime.DeepCopyJSON(obj)
		obj["throttled"] = true
		if rank >= rankNonCompliant {
			projectViolation(obj)
		}
		entry.throttled = true
	}
	entry.lastSpec = spec
	entry.hasSpec = true
	entry.gvr = gvr

	if entry.throttled {
		// The compliant field flips back within milliseconds. Keep the violation
		// that was just observed so the UI matches the cached Node watch event.
		if rank > entry.severeRank {
			entry.severeRank = rank
			entry.severe = runtime.DeepCopyJSON(obj)
			entry.lastSent = runtime.DeepCopyJSON(obj)
		}
		holding := rank >= rankNonCompliant || entry.severeRank >= rankNonCompliant
		s.noteRootLocked(entry, holding)
		if entry.lastCached.IsZero() || now.Sub(entry.lastCached) >= s.cfg.cooldown {
			if entry.severe != nil && entry.severeRank > rank {
				copyStatus(obj, entry.severe)
			}
			entry.lastCached = now
			entry.lastSent = runtime.DeepCopyJSON(obj)
			entry.severe = nil
			entry.severeRank = 0
			return false
		}
		return true
	}
	entry.lastCached = time.Time{}
	entry.severe = nil
	entry.severeRank = 0
	s.releaseRootLocked(entry)
	return false
}

func (s *flapState) recover(now time.Time) []recoveredEvent {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	var out []recoveredEvent
	for key, entry := range s.entries {
		if now.Sub(entry.emerged) > s.cfg.ttl {
			s.releaseRootLocked(entry)
			delete(s.entries, key)
			continue
		}
		if !entry.throttled || len(entry.timestamps) == 0 {
			continue
		}
		last := entry.timestamps[len(entry.timestamps)-1]
		if now.Sub(last) <= s.cfg.cooldown {
			continue
		}
		if entry.object != nil {
			obj := runtime.DeepCopyJSON(entry.object)
			out = append(out, recoveredEvent{object: obj, gvr: entry.gvr})
			kind, namespace, name := kindNSName(obj)
			applog.Logger().Warn(formatFlappingRecoveredMessage(kind, namespace, name))
		}
		s.releaseRootLocked(entry)
		entry.object = nil
		entry.lastSent = nil
		entry.severe = nil
		entry.severeRank = 0
		entry.throttled = false
		entry.lastCached = time.Time{}
	}
	return out
}

func (s *flapState) noteRootLocked(entry *flapEntry, violating bool) {
	if entry == nil || !entry.trackedRoot {
		return
	}
	if violating {
		s.claimRootLocked(entry)
		return
	}
	s.releaseRootLocked(entry)
}

func (s *flapState) claimRootLocked(entry *flapEntry) {
	if entry.rootKey == "" || entry.cluster == "" {
		return
	}
	clusters := s.rootBad[entry.rootKey]
	if clusters == nil {
		clusters = map[string]struct{}{}
		s.rootBad[entry.rootKey] = clusters
	}
	if _, ok := clusters[entry.cluster]; ok {
		return
	}
	clusters[entry.cluster] = struct{}{}
	s.rootDirty[entry.rootKey] = struct{}{}
}

func (s *flapState) releaseRootLocked(entry *flapEntry) {
	if entry == nil || !entry.trackedRoot || entry.rootKey == "" || entry.cluster == "" {
		return
	}
	clusters := s.rootBad[entry.rootKey]
	if _, ok := clusters[entry.cluster]; !ok {
		return
	}
	delete(clusters, entry.cluster)
	if len(clusters) == 0 {
		delete(s.rootBad, entry.rootKey)
	}
	s.rootDirty[entry.rootKey] = struct{}{}
}

func (s *flapState) rememberRoot(obj map[string]any, gvr schema.GroupVersionResource) {
	if s == nil || obj == nil {
		return
	}
	kind, namespace, name := kindNSName(obj)
	if kind != policyKind || name == "" {
		return
	}
	if _, _, ok := replicatedRoot(obj); ok {
		return
	}
	key := namespace + "/" + name
	s.mu.Lock()
	defer s.mu.Unlock()
	s.rootObjs[key] = runtime.DeepCopyJSON(obj)
	s.rootGVR[key] = gvr
}

// forget drops flap and root cache for a deleted Policy so recover / takeDirtyRoots
// cannot republish it as MODIFIED after the cooldown.
func (s *flapState) forget(obj map[string]any) {
	if s == nil || obj == nil {
		return
	}
	kind, namespace, name := kindNSName(obj)
	if kind != policyKind {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	key := flapKey(kind, namespace, name)
	if entry := s.entries[key]; entry != nil {
		s.releaseRootLocked(entry)
		delete(s.entries, key)
	}
	rootKey := namespace + "/" + name
	delete(s.rootObjs, rootKey)
	delete(s.rootGVR, rootKey)
	delete(s.rootDirty, rootKey)
}

func (s *flapState) decorateRoot(obj map[string]any) {
	if s == nil || obj == nil {
		return
	}
	kind, namespace, name := kindNSName(obj)
	if kind != policyKind {
		return
	}
	s.mu.Lock()
	clusters := copyClusters(s.rootBad[namespace+"/"+name])
	s.mu.Unlock()
	if len(clusters) == 0 {
		return
	}
	projectRootClusters(obj, clusters)
}

func (s *flapState) takeDirtyRoots() []recoveredEvent {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []recoveredEvent
	for key := range s.rootDirty {
		raw := s.rootObjs[key]
		if raw == nil {
			continue
		}
		delete(s.rootDirty, key)
		obj := runtime.DeepCopyJSON(raw)
		if clusters := s.rootBad[key]; len(clusters) > 0 {
			projectRootClusters(obj, clusters)
		}
		out = append(out, recoveredEvent{object: obj, gvr: s.rootGVR[key]})
	}
	return out
}

// clientPolicy is the Policy object a snapshot should send: the throttled cache,
// with root cluster status rewritten while a replicated policy is still conflicting.
func (s *flapState) clientPolicy(namespace, name string, live map[string]any) (map[string]any, bool) {
	if s == nil {
		return nil, false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	var base map[string]any
	changed := false
	if entry := s.entries[flapKey(policyKind, namespace, name)]; entry != nil && entry.throttled && entry.lastSent != nil {
		base = runtime.DeepCopyJSON(entry.lastSent)
		changed = true
	}
	if clusters := s.rootBad[namespace+"/"+name]; len(clusters) > 0 {
		if base == nil && live != nil {
			base = runtime.DeepCopyJSON(live)
		}
		if base != nil {
			projectRootClusters(base, clusters)
			changed = true
		}
	}
	return base, changed
}

func (s *flapState) entry(kind, namespace, name string) *flapEntry {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.entries[flapKey(kind, namespace, name)]
}

// Start runs the Policy flap recovery checker until ctx is done.
func (h *Hub) Start(ctx context.Context) {
	if h == nil || h.flap == nil {
		return
	}
	go h.monitorThrottle(ctx)
}

func (h *Hub) monitorThrottle(ctx context.Context) {
	interval := h.flap.cfg.interval
	applog.Logger().Info("throttling check started", "interval", interval)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			applog.Logger().Info("monitoring throttled stopped")
			return
		case <-ticker.C:
			h.publishRecovered(h.flap.clock())
		}
	}
}

func (h *Hub) publishRecovered(now time.Time) {
	if h == nil || h.flap == nil {
		return
	}
	for _, rec := range h.flap.recover(now) {
		h.push(Event{Type: TypeModified, Object: rec.object, GVR: rec.gvr})
	}
	for _, extra := range h.flap.takeDirtyRoots() {
		h.push(Event{Type: TypeModified, Object: extra.object, GVR: extra.gvr})
	}
}
