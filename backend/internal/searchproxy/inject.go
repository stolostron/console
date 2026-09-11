// Copyright Contributors to the Open Cluster Management project

package searchproxy

import (
	"encoding/json"
	"strings"
)

// InjectConnectionInitAuthorization adds Authorization to a graphql-ws connection_init payload.
func InjectConnectionInitAuthorization(connectionInitJSON string, bearerToken string) string {
	bearer := bearerToken
	if !strings.HasPrefix(bearer, "Bearer ") {
		bearer = "Bearer " + bearerToken
	}
	var msg map[string]any
	if err := json.Unmarshal([]byte(connectionInitJSON), &msg); err != nil {
		return connectionInitJSON
	}
	typ, _ := msg["type"].(string)
	if typ != "connection_init" {
		return connectionInitJSON
	}
	payload, ok := msg["payload"].(map[string]any)
	if !ok {
		payload = map[string]any{}
	}
	payload["Authorization"] = bearer
	msg["payload"] = payload
	out, err := json.Marshal(msg)
	if err != nil {
		return connectionInitJSON
	}
	return string(out)
}
