const mqtt = require("mqtt");
const client = require("../Connections/db");
// const connectUrl = `mqtt://mosquitto:1883`;
// const mqttClient = mqtt.connect(connectUrl, {
//   clean: true,
//   username: "RTFlocalBroker",
//   password: "rtf1www"
// });

const connectUrl = `mqtt://3.141.141.38`;
const mqttClient = mqtt.connect(connectUrl, {
  clean: true,
  username: "stock_price",
  password: "VZ4VC8qv[NNjX7^:",
});


const devicesHeartbeat = () => {
  let onlineDevices = [];

  const handleMessage = (topic, message) => {
    if (topic === "heartbeat_res") {
      const device = JSON.parse(message.toString());
      const existingDevice = onlineDevices.find(
        (d) => d.device_id === device.device_id
      );

      if (existingDevice) {
        Object.assign(existingDevice, device);
      } else {
        onlineDevices.push(device);
      }
      updateTable();
    }
  };

  const updateTable = () => {
    setTimeout(() => {
      // console.log(onlineDevices);
      if (onlineDevices.length > 0) {
        const deviceNames = onlineDevices.map((d) => d.device_id);
        const query = `
          UPDATE terminals
          SET status = CASE
            WHEN mac_address IN (${deviceNames
              .map((name) => `'${name}'`)
              .join(", ")}) THEN ${1}
            ELSE ${0}
          END,
          ip_address = CASE
            ${onlineDevices
              .map(
                (device) =>
                  `WHEN mac_address = '${device.device_id}' THEN '${device.ip}'`
              )
              .join(" ")}
            ELSE NULL
          END,
          host_name = CASE
            ${onlineDevices
              .map(
                (device) =>
                  `WHEN mac_address = '${device.device_id}' THEN '${device.hostname}'`
              )
              .join(" ")}
            ELSE NULL
          END,
          availability = CASE
            WHEN mac_address IN (${deviceNames
              .map((name) => `'${name}'`)
              .join(", ")}) THEN ${true}
            ELSE ${false}
          END
        `;

        client.query(query, (err, updateRes) => {
          if (err) {
            console.log(err);
            return;
          }
        });
      }
    }, 2000);
  };

  const offlineDevices = () => {
    const query = `
    UPDATE terminals
    SET status = ($1),
    host_name = ($2),
    availability = ($3),
    ip_address = ($4)
  `;

    client.query(query, [0, null, false, null], (err, updateRes) => {
      if (err) {
        console.log(err);
        return;
      }
    });
  };

  mqttClient.on("message", handleMessage);

  mqttClient.subscribe("heartbeat_res", function (err, granted) {
    if (!err) {
      console.log("Subscribed to Topic Heartbeat");

      setInterval(() => {
        offlineDevices();
        setTimeout(() => {
          mqttClient.publish("heartbeat", '{"action":"heartbeat"}', (err) => {
            if (err) {
              respond.status(500).send(`MQTT Publishing Error: ${err}`);
            }
          });
        }, 500);
      }, [10000]); // Publish every 10 seconds
    } else {
      console.log("Cannot able to subscribe: ", err);
    }
  });
};

module.exports = {
  mqttClient,
  devicesHeartbeat,
};
