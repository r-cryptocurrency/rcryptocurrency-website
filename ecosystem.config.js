module.exports = {
  apps: [
    {
      name: "web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./apps/web",
      instances: "2", // Scale web server to two cores
      exec_mode: "cluster", // Enable cluster mode for load balancing
      autorestart: true,
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "ledger",
      script: "dist/src/index.js",
      cwd: "./apps/ledger",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "monitor",
      script: "dist/scripts/monitor-moons.js",
      cwd: "./apps/ledger",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "oracle",
      script: "apps/oracle/dist/index.js",
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "scraper",
      script: "dist/index.js",
      cwd: "./apps/scraper",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: "../../.env",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
