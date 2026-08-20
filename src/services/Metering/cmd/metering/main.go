package main

import (
	"context"
	"errors"
	"log/slog"
	"metering/internal/infrastructure/config"
	"metering/internal/transport/httptransport"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	logger := slog.Default()
	cfg, err := config.Load(".")
	if err != nil {
		logger.Error("Failed to load config", "error", err)
		return
	}
	var router *gin.Engine
	if cfg.Environment == "development" {
		gin.SetMode(gin.DebugMode)
	}
	router = gin.New()
	router.Use(
		gin.Recovery(),
		httptransport.CorrelationID(),
		httptransport.RequestLogger(logger),
	)
	httptransport.RegisterHealthRoutes(router)

	httpAddr := ":" + strconv.Itoa(cfg.HTTPPort)
	server := &http.Server{
		Addr:              httpAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		<-ctx.Done()
		logger.Info("Shutting down server")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("Failed to shutdown server", "error", err)
		}

		logger.Info("Cleanup complete. Exiting.")
	}()

	logger.Info("http server started", "address", httpAddr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
