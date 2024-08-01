// const { Client } = require("pg");

// const client = new Client(
//     "postgresql://rtf2:password123@postgres:5432/rtf2"

// );

// module.exports = client;

const { Client } = require("pg");

const client = new Client({
  user: "user1", // User from environment variable
  host: "postgres-db", // This should match the service name defined in docker-compose.yml
  port: 5432, // PostgreSQL port
  database: "post_db", // Database name from environment variable
  password: "newpasssword", // Password from environment variable
});

module.exports = client;
