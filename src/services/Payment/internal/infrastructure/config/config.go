package config

import (
	"errors"

	"github.com/spf13/viper"
)

type Config struct {
	HTTPPort    int    `mapstructure:"http_port"`
	Environment string `mapstructure:"environment"`
}

func Load(configDir string) (Config, error) {
	v := viper.New()

	v.AddConfigPath(configDir)
	v.SetConfigName("dev")
	v.SetConfigType("env")

	v.SetDefault("http_port", 8000)
	v.SetDefault("environment", "development")

	if err := v.BindEnv("http_port", "HTTP_PORT"); err != nil {
		return Config{}, err
	}
	if err := v.BindEnv("environment", "ENVIRONMENT"); err != nil {
		return Config{}, err
	}

	if err := v.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return Config{}, err
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return Config{}, err
	}

	return cfg, nil
}
