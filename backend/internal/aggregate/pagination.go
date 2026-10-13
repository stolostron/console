// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"encoding/json"
	"net/http"
)

// FilterSelections is filter id → selected values.
type FilterSelections map[string][]string

// SortBy matches the frontend table sort payload.
type SortBy struct {
	Index     *int   `json:"index,omitempty"`
	Direction string `json:"direction,omitempty"`
}

// RequestListView is POST /aggregate/applications body.
type RequestListView struct {
	Page    int              `json:"page"`
	PerPage int              `json:"perPage"`
	SortBy  *SortBy          `json:"sortBy,omitempty"`
	Search  string           `json:"search,omitempty"`
	Filters FilterSelections `json:"filters,omitempty"`
}

// ResultListView is POST /aggregate/applications response.
type ResultListView struct {
	Page               int             `json:"page"`
	Items              []App           `json:"items"`
	ProcessedItemCount int             `json:"processedItemCount"`
	EmptyResult        bool            `json:"emptyResult"`
	IsPreProcessed     bool            `json:"isPreProcessed"`
	Request            RequestListView `json:"request"`
}

func (h *Handler) paginate(w http.ResponseWriter, r *http.Request, token string) {
	var req RequestListView
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	items := h.Engine.applications()
	itemCount := len(items)
	page, perPage := req.Page, req.PerPage
	if perPage == -1 {
		page = 1
		perPage = itemCount
	}
	rpage := page
	emptyResult := false
	isPreProcessed := itemCount == 0
	backendLimit := h.Engine.preprocessLimit()
	startIndex, endIndex := 0, itemCount
	if itemCount > backendLimit {
		isPreProcessed = true
		if len(req.Filters) > 0 {
			items = filterApplications(req.Filters, items)
		}
		if req.Search != "" {
			items = fuseFilter(items, req.Search)
		}
		if req.SortBy != nil && req.SortBy.Index != nil && *req.SortBy.Index >= 0 {
			items = sortApplications(*req.SortBy.Index, req.SortBy.Direction == "desc", items)
		}
		if perPage <= 0 {
			perPage = itemCount
		}
		start := 0
		if page > 0 {
			start = (page - 1) * perPage
		}
		if start >= len(items) && perPage > 0 {
			rpage = (len(items) + perPage - 1) / perPage
			if rpage < 1 {
				rpage = 1
			}
		}
		itemCount = len(items)
		emptyResult = itemCount == 0
		startIndex = (rpage - 1) * perPage
		if startIndex < 0 {
			startIndex = 0
		}
		endIndex = rpage * perPage
	}
	authorized := h.Access.Authorized(r.Context(), token, items, startIndex, endIndex)
	authorized = h.Engine.addUIData(authorized)
	if authorized == nil {
		authorized = []App{}
	}
	writeJSON(w, ResultListView{
		Page:               rpage,
		Items:              authorized,
		ProcessedItemCount: itemCount,
		EmptyResult:        emptyResult,
		IsPreProcessed:     isPreProcessed,
		Request:            req,
	})
}
