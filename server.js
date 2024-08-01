const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const timeoutMiddleware = require("./controllers/timeoutMiddleware.js");
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(timeoutMiddleware(10000));

var routes = require("./routes/vmRoutes");
routes(app);
const client = require("./Connections/db.js");
const mqttClient = require("./Connections/mqtt.js");

mqttClient.mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.devicesHeartbeat();

});

mqttClient.mqttClient.on("error", (error) => {
  console.log("Error", error);
});
// client.connect((err) => {
//   if (err) {
//     console.error("Connection error", err.stack);
//   } else {
//     console.log("Connected to database");
//   }
// });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to the database");
  } catch (err) {
    console.error("Database connection error:", err.message);
  }
}

// Call the connect function to establish the database connection
connectToDatabase();

app.use((err, req, res, next) => {
  if (req.timedout) {
    // Request timed out
    res.status(504).json({ error: "Request Timeout" });
  } else {
    // Other errors
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" });
  }
});

app.listen(8082, () => {
  console.log("Backend server listening on port 3000");
});

module.exports = { app };
