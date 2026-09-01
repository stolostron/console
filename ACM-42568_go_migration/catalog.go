/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type CatalogFile struct {
	Cases     []Case     `yaml:"cases"`
	Resources []Resource `yaml:"resources"`
}

type Resource struct {
	Kind                   string `yaml:"kind"`
	APIVersion             string `yaml:"apiVersion"`
	Polled                 bool   `yaml:"polled"`
	ForwardEventsToClients *bool  `yaml:"forwardEventsToClients"`
}

type Case struct {
	ID             string            `yaml:"id"`
	Group          string            `yaml:"group"`
	Kind           string            `yaml:"kind"` // rest (default), sse, websocket
	Description    string            `yaml:"description"`
	Method         string            `yaml:"method"`
	Path           string            `yaml:"path"`
	Auth           string            `yaml:"auth"` // none, bearer, cookie, both, invalid
	Headers        map[string]string `yaml:"headers"`
	Body           any               `yaml:"body"`
	RawBody        string            `yaml:"rawBody"`
	ContentType    string            `yaml:"contentType"`
	AlsoMulticloud bool              `yaml:"alsoMulticloud"`
	Soft           bool              `yaml:"soft"`
	SoftStatuses   []int             `yaml:"softStatuses"`
	Expect         Expect            `yaml:"expect"`
	TimeoutSeconds int               `yaml:"timeoutSeconds"`
	WS             *WSSpec           `yaml:"ws"`
}

type Expect struct {
	Status              []int             `yaml:"status"`
	BodyEmpty           bool              `yaml:"bodyEmpty"`
	ContentTypeContains string            `yaml:"contentTypeContains"`
	HeaderPresent       []string          `yaml:"headerPresent"`
	HeaderEquals        map[string]string `yaml:"headerEquals"`
	HeaderAbsent        []string          `yaml:"headerAbsent"`
	JSONKeys            []string          `yaml:"jsonKeys"`
	JSONType            string            `yaml:"jsonType"`
	JSONPathEquals      map[string]string `yaml:"jsonPathEquals"`
	SetCookieContains   []string          `yaml:"setCookieContains"`
	SSE                 *SSEExpect        `yaml:"sse"`
}

type SSEExpect struct {
	FirstType                   string   `yaml:"firstType"`
	LastType                    string   `yaml:"lastType"`
	RequireTypes                []string `yaml:"requireTypes"`
	ObjectHasKindAPIVersionName bool     `yaml:"objectHasKindApiVersionName"`
	KindsSubsetOfWatched        bool     `yaml:"kindsSubsetOfWatched"`
	SettingsKeys                []string `yaml:"settingsKeys"`
}

type WSSpec struct {
	Subprotocol   string   `yaml:"subprotocol"`
	Send          []string `yaml:"send"`
	ExpectType    string   `yaml:"expectType"`
	ExpectUpgrade bool     `yaml:"expectUpgrade"`
}

func LoadCatalog(dir string) ([]Case, []Resource, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, nil, err
	}
	var cases []Case
	var resources []Resource
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") {
			continue
		}
		path := filepath.Join(dir, e.Name())
		b, err := os.ReadFile(path)
		if err != nil {
			return nil, nil, fmt.Errorf("%s: %w", path, err)
		}
		var file CatalogFile
		if err := yaml.Unmarshal(b, &file); err != nil {
			return nil, nil, fmt.Errorf("%s: %w", path, err)
		}
		for i := range file.Cases {
			c := file.Cases[i]
			if c.Kind == "" {
				c.Kind = "rest"
			}
			if c.Method == "" {
				c.Method = "GET"
			}
			if len(c.Expect.Status) == 0 {
				c.Expect.Status = []int{200}
			}
			cases = append(cases, c)
		}
		resources = append(resources, file.Resources...)
	}
	if len(cases) == 0 {
		return nil, nil, fmt.Errorf("no cases loaded from %s", dir)
	}
	return cases, resources, nil
}

func WatchedKindSet(resources []Resource) map[string]struct{} {
	out := make(map[string]struct{})
	for _, r := range resources {
		if r.ForwardEventsToClients != nil && !*r.ForwardEventsToClients {
			continue
		}
		out[r.Kind] = struct{}{}
	}
	return out
}
