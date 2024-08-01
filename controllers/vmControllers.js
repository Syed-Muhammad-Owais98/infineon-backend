const client = require("../Connections/db");
const mqttClient = require("../Connections/mqtt");

exports.createTable = async (req, res) => {
  client.query(
    `
    CREATE TABLE ${req.body.tableName} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL
    )
  `,
    (err, pass) => {
      if (err) {
        res.status(500).send(err);
        console.error(err);
      } else {
        res
          .status(200)
          .send(`Table " ${req.body.tableName}" created successfully`);
      }
    }
  );
};

exports.deleteTable = async (req, res) => {
  client.query(
    `
    DROP TABLE ${req.tableName} 
  `,
    (err, pass) => {
      if (err) {
        res.status(500).send(err);
        console.error(err);
      } else {
        res.status(200).send(`Table " ${req.tableName}" Deleted successfully`);
      }
    }
  );
};

exports.getTables = async (req, res) => {
  client.query(
    `
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
`,
    (err, pass) => {
      if (err) {
        res.status(500).send(err);
        console.error(err);
      } else {
        res.status(200).send(pass.rows);
      }
    }
  );
};

const subscribe = async (id) =>
  mqttClient.mqttClient.subscribe(
    `vmid_${id}_USBDevices`,
    function (err, granted) {
      if (!err) {
        console.log("Susbcribed to Topic USBList");
      } else {
        console.log("Cannot able to subscribe: ", err);
      }
    }
  );

exports.getUSBDevices = async (req, res) => {
  if (
    req.body.hostname === null ||
    req.body.hostname === undefined ||
    req.body.hostname === ""
  ) {
    res
      .status(400)
      .send({ error: 'Bad Request: The "hostname" field is required.' });
    return;
  }
  let terminalData;
  await client.query(
    `SELECT * FROM terminals WHERE host_name = $1`,
    [req.body.hostname],
    (selectErr, selectResult) => {
      if (selectErr) {
        console.log(selectErr.detail);
        res.status(500).send(selectErr.detail);
        return;
      }
      console.log(selectResult);
      if (selectResult.rows.length > 0) {
        terminalData = selectResult.rows[0];
        subscribe(terminalData.mac_address);
        mqttClient.mqttClient.once("message", async function (topic, message) {
          // Check if the received message is for USB devices
          if (topic === `vmid_${terminalData.mac_address}_USBDevices`) {
            // Parse the JSON message
            const data = JSON.parse(message.toString());
            console.log("aaaaaaa=>",data)
            // Extract the available devices array and log it
            const availableDevices = data.available_devices.map((devices) => {
              return { ...devices, port: "" };
            });
            const hostname = data.hostname;
            res
              .status(200)
              .json({ usbList: availableDevices, host_name: hostname });
          }
        });
        mqttClient.mqttClient.publish(
          `vmid_${terminalData.mac_address}`,
          `{ "action": "listUSBDevices" }`,
          function (err) {
            if (err) {
              res.status(500).send(err);
            }
          }
        );
      } else {
        res.status(404).send({
          message: `'${req.body.hostname}' terminal does not exist in data`,
        });
      }
    }
  );
};

exports.getTerminalTable = async (req, res) => {
  client.query("SELECT * FROM terminals", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: err.message });
    } else {
      res.status(200).send(result.rows);
    }
  });
};

exports.addDataTerminal = async (req, res) => {
  const { name } = req.body;
  if (name === null || name === undefined || name === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "name" field is required.' });
    return;
  }

  // Check if the name already exists in the terminals table
  client.query(
    `SELECT * FROM terminals WHERE mac_address = $1`,
    [name],
    (selectErr, selectResult) => {
      if (selectResult && selectResult.rowCount > 0) {
        res.status(400).send({
          message: `Name '${name}' already exists in terminals table`,
        });
      } else {
        // Insert the data into the terminals table
        client.query(
          `INSERT INTO terminals (mac_address, status, availability , ip_address, host_name) VALUES ($1, $2, $3 , null, null)`,
          [name, 0, false],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error(insertErr);
              res.status(500).send({ message: insertErr.detail });
            } else {
              // Retrieve the updated terminals table
              client.query("SELECT * FROM terminals", (tableErr, tableRes) => {
                if (tableErr) {
                  res.status(500).send(tableErr.detail);
                } else {
                  res.status(200).send({
                    message: `Data Added Successfully: rows=${insertResult.rowCount}`,
                    terminal_table: tableRes.rows,
                  });
                }
              });
            }
          }
        );
      }
    }
  );
};

exports.connectTerminal = async (req, res) => {
  const { id, connection } = req.body;
  if (id === null || id === undefined || id === "") {
    res.status(400).send({ error: 'Bad Request: The "id" field is required.' });
    return;
  }
  if (connection === null || connection === undefined || connection === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "connection" field is required.' });
    return;
  }
  const available = connection === "connect" ? false : true;
  await client.query(
    `
  UPDATE terminals
  SET availability = ($1)
  WHERE mac_address = ($2);
`,
    [available, id],
    (updateErr, updateRes) => {
      if (updateErr) {
        res.status(500).send(updateErr);
        return;
      }
      res.status(200).send({
        message:
          connection === "connect"
            ? "The Device is Connected"
            : "The Device is Disconnected",
        device_id: id,
      });
    }
  );
};

exports.getOnlineTerminal = async (req, res) => {
  const query = `
        SELECT * FROM terminals
        WHERE status = $1 AND availability = true;
      `;

  try {
    const result = await client.query(query, [1]);
    const devices = result.rows;
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.bindTerminal = async (req, res) => {
  const { busId, deviceId, action } = req.body;
  let data;
  if (busId === null || busId === undefined || busId === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "busId" field is required.' });
    return;
  }
  if (deviceId === null || deviceId === undefined || deviceId === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "deviceId" field is required.' });
    return;
  }
  if (action === null || action === undefined || action === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "action" field is required.' });
    return;
  }
  if (action === "bind" || action === "unbind") {
    client.query(
      `SELECT * FROM terminals WHERE mac_address = $1`,
      [req.body.deviceId],
      (selectErr, selectResult) => {
        if (selectResult.rows.length > 0) {
          mqttClient.mqttClient.subscribe(`bind_res`, function (err, granted) {
            if (!err) {
              console.log("Susbcribed to Binding Topic");
            } else {
              console.log("Cannot able to subscribe: ", err);
            }
          });

          mqttClient.mqttClient.once(
            "message",
            async function (topic, message) {
              // Check if the received message is for USB devices
              if (topic === `bind_res`) {
                const bufferData = Buffer.from(message, "hex");
                const jsonString = bufferData.toString("utf-8");
                data = JSON.parse(jsonString);
                if (data) {
                  if (data.bind_status == "failed")
                    res.status(500).send({
                      message: `Binding failed for the Bus id: ${busId} for Terminal ${deviceId}`,
                    });
                } else {
                  res.status(200).send({
                    message: `Binding Complete.`,
                    binding_data: data,
                  });
                }
              }
            }
          );
          mqttClient.mqttClient.publish(
            `${action}_${deviceId}`,
            `{
              "action" : "${action}",
              "mac" : "${deviceId}",
              "busid" : "${busId}"
            }`,
            function (err) {
              if (err) {
                res.status(500).send({ message: err });
              }
            }
          );
        } else {
          res.status(404).send({
            error: `'${deviceId}' terminal does not exist in data`,
          });
        }
      }
    );
  } else {
    res.status(422).send({
      error: "'action' field value can either be 'bind' or 'unbind'.",
    });
  }
};
