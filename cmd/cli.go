// cmd/cli.go
package cmd

import (
	"fmt"
	"gobackup/internal/backup"

	"github.com/spf13/cobra"
)

var cliCmd = &cobra.Command{
	Use:   "cli",
	Short: "Run gobackup in CLI mode",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Running in CLI mode...")

		if Cfg == nil {
			return fmt.Errorf("configuration not loaded")
		}

		// Escanear archivos modificados
		files, err := backup.ScanModifiedFiles(Cfg.SourceDir, Cfg.ModifiedMinutes)
		if err != nil {
			return fmt.Errorf("error scanning files: %w", err)
		}

		fmt.Printf("Found %d modified files:\n", len(files))
		for _, f := range files {
			fmt.Println(" -", f)
		}

		if len(files) == 0 {
			fmt.Println("No files to backup.")
			return nil
		}

		// Copiar archivos concurrentemente
		err = backup.CopyFilesConcurrent(files, Cfg.SourceDir, Cfg.BackupDir, Cfg.MaxConcurrency)
		if err != nil {
			return fmt.Errorf("error copying files: %w", err)
		}

		fmt.Println("Backup completed successfully!")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(cliCmd)
}
