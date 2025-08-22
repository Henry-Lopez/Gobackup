package backup

import (
	"gobackup/internal/config"
	"gobackup/internal/logger"
)

// RunBackup inicia el proceso de escaneo y copia de archivos.
// Ahora recibe las rutas de origen y destino como parámetros.
func RunBackup(sourceDir, backupDir string) error {
	// Se carga la configuración para obtener parámetros como ModifiedMinutes y MaxConcurrency.
	cfg, err := config.LoadConfig("config/default.json")
	if err != nil {
		logger.Errorf("Error cargando configuración: %v", err)
		return err
	}

	logger.Infof("Iniciando proceso de respaldo desde %s hacia %s", sourceDir, backupDir)

	// Escanear archivos modificados
	files, err := ScanModifiedFiles(sourceDir, cfg.ModifiedMinutes)
	if err != nil {
		logger.Errorf("Error escaneando archivos: %v", err)
		return err
	}

	Status.Reset(len(files)) // Se pasa el número total de archivos a la función Reset
	logger.Infof("Archivos detectados para copiar: %d", len(files))

	if len(files) == 0 {
		logger.Infof("No se encontraron archivos para copiar.")
		Status.SetDone() // Marcar como finalizado si no hay archivos
		return nil
	}

	// Copiar archivos concurrentemente
	if err := CopyFilesConcurrent(files, sourceDir, backupDir, cfg.MaxConcurrency); err != nil {
		logger.Errorf("Error copiando archivos: %v", err)
		return err
	}

	logger.Infof("Respaldo finalizado correctamente.")
	Status.SetDone() // Marcar como finalizado al completar
	return nil
}
