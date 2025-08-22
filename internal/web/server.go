package web

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gobackup/internal/config"
	"log"
)

// StartServer inicia el servidor web de Gobackup
func StartServer(cfg *config.Config) {
	router := gin.Default()

	// Configura tus rutas aquí
	setupRoutes(router)

	// Usa el puerto de la configuración
	if err := router.Run(fmt.Sprintf(":%d", cfg.ServerPort)); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
