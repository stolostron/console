/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

func (cfg Config) DialWS(base string, cs Case, path string) (*websocket.Conn, *http.Response, error) {
	url := cfg.ResolveURL(base, path)
	url = toWSURL(url)
	hdr := http.Header{}
	for k, v := range cs.Headers {
		hdr.Set(k, v)
	}
	req := &http.Request{Header: hdr}
	cfg.applyAuth(req, cs.Auth)
	hdr = req.Header

	dialer := websocket.Dialer{
		HandshakeTimeout: 15 * time.Second,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: cfg.InsecureTLS, //nolint:gosec
		},
	}
	if cs.WS != nil && cs.WS.Subprotocol != "" {
		dialer.Subprotocols = []string{cs.WS.Subprotocol}
	}
	return dialer.Dial(url, hdr)
}

func (cfg Config) RunWebSocket(base string, cs Case, path string) error {
	timeout := time.Duration(cs.TimeoutSeconds) * time.Second
	if timeout <= 0 {
		timeout = 20 * time.Second
	}
	conn, resp, err := cfg.DialWS(base, cs, path)
	if err != nil {
		status := 0
		if resp != nil {
			status = resp.StatusCode
		}
		if cs.Soft && (containsInt(cs.SoftStatuses, status) || status == 0) {
			return skipSoft(fmt.Sprintf("websocket dial: %v (status %d)", err, status))
		}
		return fmt.Errorf("websocket dial: %w (status %d)", err, status)
	}
	defer conn.Close()

	if cs.WS != nil && cs.WS.ExpectUpgrade {
		return nil
	}
	deadline := time.Now().Add(timeout)
	_ = conn.SetReadDeadline(deadline)
	_ = conn.SetWriteDeadline(deadline)

	if cs.WS != nil {
		for _, msg := range cs.WS.Send {
			if err := conn.WriteMessage(websocket.TextMessage, []byte(msg)); err != nil {
				if cs.Soft {
					return skipSoft("ws write: " + err.Error())
				}
				return fmt.Errorf("ws write: %w", err)
			}
		}
		if cs.WS.ExpectType != "" {
			_, payload, err := conn.ReadMessage()
			if err != nil {
				if cs.Soft {
					return skipSoft("ws read: " + err.Error())
				}
				return fmt.Errorf("ws read: %w", err)
			}
			var parsed map[string]any
			if err := json.Unmarshal(payload, &parsed); err != nil {
				if cs.Soft {
					return skipSoft("ws json: " + err.Error())
				}
				return fmt.Errorf("ws json: %w body=%s", err, truncate(payload, 200))
			}
			got := str(parsed["type"])
			if got != cs.WS.ExpectType {
				if cs.Soft {
					return skipSoft(fmt.Sprintf("ws type %q want %q", got, cs.WS.ExpectType))
				}
				return fmt.Errorf("ws type %q, want %q (payload=%s)", got, cs.WS.ExpectType, truncate(payload, 200))
			}
		}
	}
	return nil
}

func toWSURL(u string) string {
	switch {
	case strings.HasPrefix(u, "https://"):
		return "wss://" + strings.TrimPrefix(u, "https://")
	case strings.HasPrefix(u, "http://"):
		return "ws://" + strings.TrimPrefix(u, "http://")
	default:
		return u
	}
}
