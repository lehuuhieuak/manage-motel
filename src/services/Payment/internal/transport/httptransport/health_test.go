package httptransport

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func NewRouter(t *testing.T) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	RegisterHealthRoutes(router)

	return router
}

func TestLiveHealth_ReturnsOk(t *testing.T) {
	router := NewRouter(t)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health/live", nil)

	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("Expected status code %d, but got %d", http.StatusOK, response.Code)
	}

	var body map[string]string
	err := json.Unmarshal(response.Body.Bytes(), &body)
	if err != nil {
		t.Fatalf("Failed to unmarshal response body: %v", err)
	}

	if body["status"] != "ok" {
		t.Fatalf("Expected body status to be 'ok', but got '%s'", body["status"])
	}
}

func TestReadyHealth_ReturnsOk(t *testing.T) {
	router := NewRouter(t)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health/ready", nil)

	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("Expected status code %d, but got %d", http.StatusOK, response.Code)
	}

	var body map[string]string
	err := json.Unmarshal(response.Body.Bytes(), &body)
	if err != nil {
		t.Fatalf("Failed to unmarshal response body: %v", err)
	}

	if body["status"] != "ready" {
		t.Fatalf("Expected body status to be 'ready', but got '%s'", body["status"])
	}
}
