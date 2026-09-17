// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"slices"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	applog "github.com/stolostron/console/backend/internal/log"
)

// SSRR requires a namespace; cluster-scoped kinds are reviewed in this probe namespace only.
const clusterScopedRulesNamespace = "default"

type kindAccessType int

const (
	kindAccessDenyAll kindAccessType = iota
	kindAccessAllowAll
	kindAccessAllowNames
	kindAccessIncomplete
)

type kindGetAccess struct {
	typ   kindAccessType
	names map[string]struct{}
}

type subjectRulesStatus struct {
	incomplete      bool
	unavailable     bool
	evaluationError string
	resourceRules   []authzv1.ResourceRule
}

type kindAccessKey struct {
	namespace, group, resource string
}

type timedRules struct {
	status subjectRulesStatus
	expiry time.Time
}

type timedKindAccess struct {
	access kindGetAccess
	expiry time.Time
}

type rulesInflight struct {
	done   chan struct{}
	status subjectRulesStatus
}

func (a *SSARAccess) clusterScoped(kind string) bool {
	if a != nil && a.isClusterScoped != nil {
		return a.isClusterScoped(kind)
	}
	return false
}

func rulesNamespaceFor(kind, namespace string, clusterScoped bool) string {
	if clusterScoped {
		return clusterScopedRulesNamespace
	}
	if namespace != "" {
		return namespace
	}
	return clusterScopedRulesNamespace
}

func ruleGrantsKindAccess(rule authzv1.ResourceRule, group, resource string) (allowAll bool, names []string) {
	if !slices.Contains(rule.Verbs, "*") && !slices.Contains(rule.Verbs, "get") &&
		!slices.Contains(rule.Verbs, "list") && !slices.Contains(rule.Verbs, "watch") {
		return false, nil
	}
	if !slices.Contains(rule.APIGroups, "*") && !slices.Contains(rule.APIGroups, group) {
		return false, nil
	}
	if !slices.Contains(rule.Resources, "*") && !slices.Contains(rule.Resources, resource) {
		return false, nil
	}
	if len(rule.ResourceNames) == 0 || slices.Contains(rule.ResourceNames, "*") {
		return true, nil
	}
	return false, rule.ResourceNames
}

func evaluateKindGetAccess(rules subjectRulesStatus, group, resource string) kindGetAccess {
	if rules.evaluationError != "" {
		if len(rules.resourceRules) == 0 {
			return kindGetAccess{typ: kindAccessDenyAll}
		}
		return kindGetAccess{typ: kindAccessIncomplete}
	}

	names := map[string]struct{}{}
	for _, rule := range rules.resourceRules {
		allowAll, ruleNames := ruleGrantsKindAccess(rule, group, resource)
		if allowAll {
			return kindGetAccess{typ: kindAccessAllowAll}
		}
		for _, name := range ruleNames {
			names[name] = struct{}{}
		}
	}
	if len(names) > 0 {
		return kindGetAccess{typ: kindAccessAllowNames, names: names}
	}
	if rules.unavailable {
		return kindGetAccess{typ: kindAccessIncomplete}
	}
	if len(rules.resourceRules) == 0 {
		return kindGetAccess{typ: kindAccessDenyAll}
	}
	if rules.incomplete {
		return kindGetAccess{typ: kindAccessIncomplete}
	}
	return kindGetAccess{typ: kindAccessDenyAll}
}

func (a *SSARAccess) getSubjectRules(ctx context.Context, token, namespace string) subjectRulesStatus {
	now := time.Now()
	th := hashToken(token)
	a.mu.Lock()
	st := a.ensureTokenLocked(th)
	if e, ok := st.rules[namespace]; ok && e.expiry.After(now) {
		status := e.status
		a.mu.Unlock()
		return status
	}
	if f, ok := st.rulesFlight[namespace]; ok {
		a.mu.Unlock()
		select {
		case <-f.done:
			return f.status
		case <-ctx.Done():
			return subjectRulesStatus{incomplete: true, unavailable: true}
		}
	}
	f := &rulesInflight{done: make(chan struct{})}
	st.rulesFlight[namespace] = f
	a.mu.Unlock()

	status := a.fetchSubjectRules(ctx, token, th, namespace)

	a.mu.Lock()
	if st = a.byToken[th]; st != nil {
		delete(st.rulesFlight, namespace)
		st.last = time.Now()
		if !status.unavailable {
			if st.rules == nil {
				st.rules = map[string]timedRules{}
			}
			st.rules[namespace] = timedRules{status: status, expiry: time.Now().Add(accessCacheTTL)}
		}
	}
	a.mu.Unlock()
	f.status = status
	close(f.done)
	return status
}

func (a *SSARAccess) fetchSubjectRules(ctx context.Context, token, th, namespace string) subjectRulesStatus {
	client, err := a.clientFor(token, th)
	if err != nil {
		applog.Logger().Warn("selfsubjectrulesreview failed; falling back to per-object SSAR", "error", err)
		return subjectRulesStatus{incomplete: true, unavailable: true}
	}
	review, err := client.AuthorizationV1().SelfSubjectRulesReviews().Create(ctx, &authzv1.SelfSubjectRulesReview{
		Spec: authzv1.SelfSubjectRulesReviewSpec{Namespace: namespace},
	}, metav1.CreateOptions{})
	if err != nil {
		applog.Logger().Warn("selfsubjectrulesreview failed; falling back to per-object SSAR", "error", err)
		return subjectRulesStatus{incomplete: true, unavailable: true}
	}
	if review == nil {
		return subjectRulesStatus{incomplete: true, unavailable: true}
	}
	return subjectRulesStatus{
		incomplete:      review.Status.Incomplete,
		evaluationError: review.Status.EvaluationError,
		resourceRules:   review.Status.ResourceRules,
	}
}

func (a *SSARAccess) resolveKindGetAccess(ctx context.Context, token, kind, namespace, group, resource string) kindGetAccess {
	ns := rulesNamespaceFor(kind, namespace, a.clusterScoped(kind))
	key := kindAccessKey{namespace: ns, group: group, resource: resource}
	now := time.Now()
	th := hashToken(token)
	a.mu.Lock()
	st := a.ensureTokenLocked(th)
	if e, ok := st.kindAccess[key]; ok && e.expiry.After(now) {
		access := e.access
		a.mu.Unlock()
		return access
	}
	a.mu.Unlock()

	rules := a.getSubjectRules(ctx, token, ns)
	access := evaluateKindGetAccess(rules, group, resource)

	a.mu.Lock()
	st = a.ensureTokenLocked(th)
	if !rules.unavailable {
		if st.kindAccess == nil {
			st.kindAccess = map[kindAccessKey]timedKindAccess{}
		}
		st.kindAccess[key] = timedKindAccess{access: access, expiry: time.Now().Add(accessCacheTTL)}
	}
	a.mu.Unlock()
	return access
}

func (a *SSARAccess) applyKindGetAccess(
	ctx context.Context,
	token string,
	access kindGetAccess,
	group, resource, kind, name, namespace string,
) (bool, error) {
	switch access.typ {
	case kindAccessDenyAll:
		return false, nil
	case kindAccessAllowAll:
		return true, nil
	case kindAccessAllowNames:
		if name == "" || access.names == nil {
			return false, nil
		}
		_, ok := access.names[name]
		return ok, nil
	case kindAccessIncomplete:
		return a.incompleteFallback(ctx, token, group, resource, kind, name, namespace)
	default:
		return false, nil
	}
}

func (a *SSARAccess) canGetResource(ctx context.Context, token, group, resource, kind, name, namespace string) (bool, error) {
	access := a.resolveKindGetAccess(ctx, token, kind, namespace, group, resource)
	if a.clusterScoped(kind) && access.typ != kindAccessDenyAll {
		return a.ssarGet(ctx, token, group, resource, kind, name, namespace)
	}
	return a.applyKindGetAccess(ctx, token, access, group, resource, kind, name, namespace)
}
