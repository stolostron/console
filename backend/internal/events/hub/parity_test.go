// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"bufio"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

// TestSSEParitySkipWhenMissing compares GET /events snapshots from Go vs Node.
// Set CONTRACT_GO_EVENTS_URL (e.g. https://localhost:4000/events),
// CONTRACT_NODE_EVENTS_URL (e.g. https://localhost:4001/events), and
// CONTRACT_EVENTS_TOKEN (or rely on cookies in CONTRACT_EVENTS_COOKIE).
func TestSSEParitySkipWhenMissing(t *testing.T) {
	goURL := os.Getenv("CONTRACT_GO_EVENTS_URL")
	nodeURL := os.Getenv("CONTRACT_NODE_EVENTS_URL")
	if goURL == "" || nodeURL == "" {
		t.Skip("set CONTRACT_GO_EVENTS_URL and CONTRACT_NODE_EVENTS_URL to compare SSE snapshots")
	}
	token := os.Getenv("CONTRACT_EVENTS_TOKEN")
	goSet := snapshotIdentities(t, goURL, token)
	nodeSet := snapshotIdentities(t, nodeURL, token)
	if len(goSet) == 0 && len(nodeSet) == 0 {
		t.Fatal("both snapshots empty")
	}
	var missing []string
	for id := range nodeSet {
		if !goSet[id] {
			missing = append(missing, "go missing "+id)
		}
	}
	for id := range goSet {
		if !nodeSet[id] {
			missing = append(missing, "node missing "+id)
		}
	}
	if len(missing) > 0 {
		t.Fatalf("SSE snapshot mismatch (%d): %s", len(missing), strings.Join(missing[:min(10, len(missing))], "; "))
	}
}

func snapshotIdentities(t *testing.T, url, token string) map[string]bool {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Accept-Encoding", "identity")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if c := os.Getenv("CONTRACT_EVENTS_COOKIE"); c != "" {
		req.Header.Set("Cookie", c)
	}
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("%s status %d", url, resp.StatusCode)
	}
	out := map[string]bool{}
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 0, 1024*1024), 16*1024*1024)
	for sc.Scan() {
		line := sc.Text()
		payload := strings.TrimPrefix(line, "data:")
		payload = strings.TrimPrefix(payload, " ")
		if payload == line || payload == "" {
			continue
		}
		var ev struct {
			Type   string `json:"type"`
			Object struct {
				Kind       string `json:"kind"`
				APIVersion string `json:"apiVersion"`
				Metadata   struct {
					Name      string `json:"name"`
					Namespace string `json:"namespace"`
				} `json:"metadata"`
			} `json:"object"`
		}
		if err := json.Unmarshal([]byte(payload), &ev); err != nil {
			continue
		}
		if ev.Type == TypeLoaded {
			break
		}
		if ev.Type != TypeModified && ev.Type != TypeDeleted && ev.Type != "ADDED" {
			continue
		}
		id := ev.Type + "|" + ev.Object.APIVersion + "|" + ev.Object.Kind + "|" + ev.Object.Metadata.Namespace + "|" + ev.Object.Metadata.Name
		out[id] = true
	}
	return out
}
