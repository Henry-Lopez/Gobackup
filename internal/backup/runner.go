package backup

import (
	"fmt"
	"log"
)

// Las variables globales serán inicializadas por el comando Cobra en cmd/root.go
var SourceDir string
var BackupDir string
var ModifiedMinutes int
var MaxConcurrency int

// RunBackup ejecuta el proceso completo de backup.
func RunBackup() error {
	if SourceDir == "" || BackupDir == "" {
		return fmt.Errorf("SourceDir o BackupDir no están configurados")
	}

	log.Printf("Iniciando backup desde: %s hacia: %s", SourceDir, BackupDir)

	files, err := ScanModifiedFiles(SourceDir, ModifiedMinutes)
	if err != nil {
		errMsg := fmt.Sprintf("Error escaneando archivos: %v", err)
		Status.SetError(errMsg)
		log.Println(errMsg)
		return err
	}

	Status.Reset(len(files))
	log.Printf("Archivos detectados para copiar: %d", len(files))

	if len(files) == 0 {
		log.Println("No hay archivos para copiar. Backup completado.")
		Status.SetDone()
		return nil
	}

	err = CopyFilesConcurrent(files, SourceDir, BackupDir, MaxConcurrency)
	if err != nil {
		errMsg := fmt.Sprintf("Error copiando archivos: %v", err)
		Status.SetError(errMsg)
		log.Println(errMsg)
		return err
	}

	Status.SetDone()
	log.Println("Backup finalizado correctamente.")
	return nil
}
