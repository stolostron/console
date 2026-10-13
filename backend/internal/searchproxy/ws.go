// Copyright Contributors to the Open Cluster Management project

package searchproxy

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"

	applog "github.com/stolostron/console/backend/internal/log"
)

func (h *Handler) serveWebSocket(w http.ResponseWriter, r *http.Request, token string) {
	endpoint := ""
	if h.Endpoint != nil {
		endpoint = h.Endpoint(r.Context())
	}
	wsURL := httpToWebSocketURL(endpoint)
	if wsURL == "" {
		failBeforeUpgrade(w, http.StatusBadGateway)
		return
	}

	dialer := h.websocketDialer(r)
	hdr := http.Header{}
	hdr.Set("Authorization", "Bearer "+token)

	upstream, resp, err := dialer.Dial(wsURL, hdr)
	if resp != nil && resp.Body != nil {
		_ = resp.Body.Close()
	}
	if err != nil {
		applog.Logger().Error("search websocket relay: upstream connect failed", "error", err, "url", wsURL)
		status := http.StatusBadGateway
		var ne net.Error
		if errors.As(err, &ne) && ne.Timeout() {
			status = http.StatusGatewayTimeout
		}
		failBeforeUpgrade(w, status)
		return
	}

	upgrader := websocket.Upgrader{
		CheckOrigin:       func(*http.Request) bool { return true },
		EnableCompression: false,
		Subprotocols:      subprotocolsForUpstream(r),
	}
	client, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		applog.Logger().Error("search websocket relay: client upgrade failed", "error", err)
		_ = upstream.Close()
		return
	}
	relay(client, upstream, token)
}

func (h *Handler) websocketDialer(r *http.Request) *websocket.Dialer {
	if h.Dialer != nil {
		cp := *h.Dialer
		if cp.HandshakeTimeout == 0 {
			cp.HandshakeTimeout = h.DialTimeout
		}
		if len(cp.Subprotocols) == 0 {
			cp.Subprotocols = subprotocolsForUpstream(r)
		}
		return &cp
	}
	return &websocket.Dialer{
		TLSClientConfig:   h.TLSConfig,
		HandshakeTimeout:  h.DialTimeout,
		EnableCompression: false,
		Subprotocols:      subprotocolsForUpstream(r),
	}
}

func failBeforeUpgrade(w http.ResponseWriter, status int) {
	w.Header().Set("Connection", "close")
	w.WriteHeader(status)
}

func subprotocolsForUpstream(r *http.Request) []string {
	raw := r.Header.Get("Sec-WebSocket-Protocol")
	if raw == "" {
		return []string{"graphql-transport-ws"}
	}
	var list []string
	for _, s := range strings.Split(raw, ",") {
		s = strings.TrimSpace(s)
		if s != "" {
			list = append(list, s)
		}
	}
	if len(list) == 0 {
		return []string{"graphql-transport-ws"}
	}
	return list
}

func relay(client, upstream *websocket.Conn, token string) {
	var (
		once sync.Once
		wg   sync.WaitGroup
	)
	closeBoth := func() {
		once.Do(func() {
			_ = client.Close()
			_ = upstream.Close()
		})
	}

	wg.Add(2)
	go func() {
		defer wg.Done()
		defer closeBoth()
		injected := false
		for {
			mt, data, err := client.ReadMessage()
			if err != nil {
				return
			}
			if !injected && mt == websocket.TextMessage {
				injected = true
				if messageType(data) == "connection_init" {
					data = []byte(InjectConnectionInitAuthorization(string(data), token))
				}
			} else if !injected {
				injected = true
			}
			if err = upstream.WriteMessage(mt, data); err != nil {
				return
			}
		}
	}()

	go func() {
		defer wg.Done()
		defer closeBoth()
		for {
			mt, data, err := upstream.ReadMessage()
			if err != nil {
				return
			}
			if err = client.WriteMessage(mt, data); err != nil {
				return
			}
		}
	}()
	wg.Wait()
}

func messageType(data []byte) string {
	var peek struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &peek); err != nil {
		return ""
	}
	return peek.Type
}
