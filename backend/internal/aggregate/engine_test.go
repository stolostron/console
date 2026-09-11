// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stolostron/console/backend/internal/searchapi"
)

func TestAddQueryInputs(t *testing.T) {
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	}, nil, nil)
	q := searchapi.NewQuery()
	e.addArgoQueryInputs(&q)
	e.addOCPQueryInputs(&q)
	e.addSystemQueryInputs(&q)
	if len(q.Variables.Input) != 3 {
		t.Fatalf("inputs %d", len(q.Variables.Input))
	}
	if q.Variables.Input[0].Filters[0].Values[0] != "Application" {
		t.Fatalf("%+v", q.Variables.Input[0])
	}
	if q.Variables.Input[1].Filters[0].Values[0] != "Deployment" {
		t.Fatalf("%+v", q.Variables.Input[1])
	}
}

func TestAggregateRemoteCachesArgo(t *testing.T) {
	var gotQuery searchapi.Query
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &gotQuery)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"searchResult":[
			{"items":[{"name":"remote-app","namespace":"argocd","cluster":"remote","healthStatus":"Healthy","syncStatus":"Synced","_uid":"1","destinationNamespace":"ns","destinationName":"in-cluster"}],"related":[]},
			{"items":[],"related":[]}
		]}}`))
	}))
	defer ts.Close()
	client := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL, Token: "sa"}
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	}, client, nil)
	if err := e.aggregateRemote(context.Background(), 1); err != nil {
		t.Fatal(err)
	}
	apps := e.applications()
	found := false
	for _, a := range apps {
		if metaName(a.Object) == "remote-app" {
			found = true
		}
	}
	if !found {
		t.Fatalf("missing remote app in %+v", apps)
	}
}

func TestPushModelQueryFromAppSet(t *testing.T) {
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {
			localCluster(),
			uObj("cluster.open-cluster-management.io/v1", "ManagedCluster", "remote", "", nil),
		},
	}, nil, nil)
	e.appSetAppsMap = map[string][]map[string]any{
		"set-1": {{
			"metadata": map[string]any{"name": "child", "namespace": "argocd"},
			"spec":     map[string]any{"destination": map[string]any{"name": "remote", "namespace": "ns"}},
			"status": map[string]any{
				"resources": []any{
					map[string]any{"kind": "Deployment", "name": "web", "namespace": "ns"},
				},
			},
		}},
	}
	q := searchapi.NewQuery()
	push, err := e.addPushModelPodQueryInputs(&q)
	if err != nil {
		t.Fatal(err)
	}
	if len(push) != 1 {
		t.Fatalf("push %v", push)
	}
	if len(q.Variables.Input) != 1 {
		t.Fatalf("query %+v", q)
	}
}
