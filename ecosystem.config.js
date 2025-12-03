module.exports = {
  apps: [
    {
      name: "web",
      script: "apps/web/node_modules/next/dist/bin/next",
      args: "start apps/web -p 3000",
      cwd: ".",
      instances: "max", // Scale web server to all available cores
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
      script: "apps/ledger/dist/src/index.js",
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
      name: "monitor",
      script: "apps/ledger/scripts/monitor-moons.ts",
      interpreter: "apps/ledger/node_modules/.bin/ts-node",
      interpreter_args: "-r tsconfig-paths/register",
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
      script: "apps/scraper/dist/index.js",
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
