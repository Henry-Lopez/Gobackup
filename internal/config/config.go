package config

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

type Config struct {
	SourceDir       string `json:"source_dir"`
	BackupDir       string `json:"backup_dir"`
	ModifiedMinutes int    `json:"modified_minutes"`
	MaxConcurrency  int    `json:"max_concurrency"`
	ServerPort      int    `json:"server_port"`
}

func LoadConfig(path string) (*Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(bytes, &cfg); err != nil {
		return nil, err
	}

	// Validaciones simples, se modificó para aceptar 0 en ModifiedMinutes.
	if cfg.SourceDir == "" || cfg.BackupDir == "" || cfg.MaxConcurrency <= 0 {
		return nil, fmt.Errorf("config validation failed: missing or invalid parameters")
	}

	if cfg.ServerPort == 0 {
		cfg.ServerPort = 8080
	}

	return &cfg, nil
}
