module.exports = {
  apps: [
    {
      name: "betinfo-backend",
      script: "./server.js",             // Main entry point for your backend
      instances: 8,                      // Fixed to 8 instances for 8-core CPU
      exec_mode: "cluster",             // Use cluster mode for multi-core utilization
      max_memory_restart: "2G",         // Each instance restarts if it exceeds 2GB
      watch: false,                     // Set to true only during development
      env: {
        NODE_ENV: "production",
        PORT: 4000                      // Note: All instances share this port in cluster mode
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      merge_logs: true,
      out_file: "./logs/out.log",       // Optional: path for standard logs
      error_file: "./logs/err.log"      // Optional: path for error logs
    }
  ]
};
