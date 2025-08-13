package web

import (
	"gobackup/internal/backup"
	"net/http"

	"github.com/gin-gonic/gin"
)

func setupRoutes(r *gin.Engine) {
	// Endpoint de bienvenida
	r.GET("/api/welcome", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to Gobackup Web Server!",
		})
	})

	// Endpoint para obtener el estado actual del backup
	r.GET("/status", func(c *gin.Context) {
		status := backup.Status.Get()
		c.JSON(http.StatusOK, status)
	})

	// Endpoint para iniciar un backup (POST /backup)
	r.POST("/backup", func(c *gin.Context) {
		// La configuración ya está cargada y no debe ser reinicializada.

		// Ejecutar backup en una goroutine para no bloquear el servidor
		go func() {
			if err := backup.RunBackup(); err != nil {
				backup.Status.SetError(err.Error())
			} else {
				backup.Status.SetDone()
			}
		}()

		c.JSON(http.StatusAccepted, gin.H{
			"message": "Backup iniciado",
			"source":  backup.SourceDir,
			"target":  backup.BackupDir,
		})
	})
}
