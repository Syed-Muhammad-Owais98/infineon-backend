const { exec } = require("child_process");
const client = require("../Connections/db");
const hubDeviceData = require("../devices-.json");

exports.listDevices = async (req, res) => {
  const command = "awusbmanager list";
  let input;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Command execution error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Command execution stderr: ${stderr}`);
      return;
    }

    input = stdout.trim();
  });

  // const data1 = `AW24-011938 (11.532.53.300:22711)
  // Group 1 (AW24-011938.1)
  //     0x01a2 (AW24-011938.1115)
  //     DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1116)
  // Group 2 (AW24-011938.2)
  // lite 2 (AW24-011938.3) (In-use by:hvf at 10.136.112.135)
  //     DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1503) (In-use by:hvf at 10.136.112.135)
  // Group  4 (AW24-011938.4)
  // little round LCD thing (AW24-011938.5)
  // lite 1 (AW24-011938.6) (In-use by:vm-18-31 at 10.136.113.107)
  //     DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1706) (In-use by:vm-18-31 at 10.136.113.107)
  // lite 3 (AW24-011938.7) (In-use by:vm-lab at 10.133.112.90)
  //     DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1707) (In-use by:vm-lab at 10.133.112.90)
  // Group  8 (AW24-011938.8)
  // Group  9 (AW24-011938.9)
  // Group 10 (AW24-011938.10)`;

  const data = `AW24-011938 (11.532.53.300:22711)
  Group 1 (AW24-011938.1)
      0x01a2 (AW24-011938.1115)
      DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1116)
  Group 2 (AW24-011938.2)
  lite 2 (AW24-011938.3) (In-use by:hvf at 10.136.112.135)
      DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1503) (In-use by:hvf at 10.136.112.135)
  Group  4 (AW24-011938.4)
  little round LCD thing (AW24-011938.5)
  lite 1 (AW24-011938.6) (In-use by:vm-18-31 at 10.136.113.107)
      DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1706) (In-use by:vm-18-31 at 10.136.113.107)
  lite 3 (AW24-011938.7) (In-use by:vm-lab at 10.133.112.90)
      DAS JDS AURIX LITE KIT V1.1 (AW24-011938.1707)
  Group  8 (AW24-011938.8)
  Group  9 (AW24-011938.9)
  Group 10 (AW24-011938.10)
  AW26-022134 (11.532.53.300:22711)
  Group 1 (AW26-022134.1)
      0x01a2 (AW26-022134.1115)
      DAS JDS AURIX LITE KIT V1.1 (AW26-022134.1116)
  Group 2 (AW26-022134.2)
  lite 2 (AW26-022134.3) (In-use by:hvf at 10.136.112.135)
      DAS JDS AURIX LITE KIT V1.1 (AW26-022134.1503) (In-use by:hvf at 10.136.112.135)
  Group  4 (AW26-022134.4)
  little round LCD thing (AW26-022134.5)
  lite 1 (AW26-022134.6) (In-use by:vm-18-31 at 10.136.113.107)
      DAS JDS AURIX LITE KIT V1.1 (AW26-022134.1706) (In-use by:vm-18-31 at 10.136.113.107)
  lite 3 (AW26-022134.7)
      DAS JDS AURIX LITE KIT V1.1 (AW26-022134.1707)
  Group  8 (AW26-022134.8)
  Group  9 (AW26-022134.9)
  Group 10 (AW26-022134.10)
  `;

  function extractData(inputText) {
    const cleanedInputText = inputText.replace(/^\s+/gm, "");
    const hubSections = cleanedInputText.trim().split(/\n(?=AW)/);
    const result = [];

    let currentHubSection = "";
    hubSections.forEach((line) => {
      if (line.startsWith("AW")) {
        if (currentHubSection !== "") {
          result.push(processHubSection(currentHubSection));
        }
        currentHubSection = line + "\n";
      } else {
        currentHubSection += line + "\n";
      }
    });

    if (currentHubSection !== "") {
      result.push(processHubSection(currentHubSection));
    }

    return result;
  }

  function processHubSection(hubSection) {
    const lines = hubSection.trim().split("\n");
    const hubInfo = lines.shift().match(/([0-9]+(\.[0-9]+)+):[0-9]+/i);
    const hubName = hubInfo.input.split(" ")[0];
    const ipAddress = hubInfo[0];

    let groups = [];
    let currentGroup = null;

    const groupreg = new RegExp(`\\(${hubName}\\.[0-9]{1,2}\\)`, "g");
    const devicereg = new RegExp(`\\(${hubName}\\.[0-9]{3,4}\\)`, "g");

    while (lines.length > 0) {
      const line = lines.shift();
      if (line.match(groupreg)) {
        currentGroup = {
          groupName: line,
          devices: [],
        };
        groups.push(currentGroup);
      } else if (line.includes("(In-use by:")) {
        const deviceInfo = line.match(/(.*?) \(In-use by:(.*?) at ([\d.]+)\)/);
        const deviceName = deviceInfo[1].trim();
        const inUseBy = deviceInfo[2];
        const inUseIp = deviceInfo[3];
        const device = {
          deviceName,
          availability: false,
          inUseBy,
          inUseIp,
        };
        if (currentGroup && currentGroup.devices) {
          currentGroup.devices.push(device);
        }
      } else if (line.match(devicereg)) {
        const device = {
          deviceName: line,
          availability: true,
        };
        if (currentGroup && currentGroup.devices) {
          currentGroup.devices.push(device);
        }
      }
    }

    return {
      hubName,
      ipAddress,
      groups,
    };
  }
  const devices = extractData(data);

  console.log(devices);

  const flattenedDevices = devices.flatMap((hub) =>
    hub.groups.flatMap((group) =>
      group.devices.map((device) => ({
        deviceName: device.deviceName,
        availability: device.availability,
        hubName: hub.hubName,
        hubIp: hub.ipAddress,
      }))
    )
  );

  const updateQuery = `
    UPDATE hub_devices
    SET availability = $2
    WHERE device_name = $1;
  `;

  const insertQuery = `
  INSERT INTO hub_devices (device_name, availability, hub_name, hub_ip)
  VALUES ($1, $2, $3, $4);
`;

  const selectQuery = `
SELECT * FROM hub_devices
WHERE device_name = $1;
`;

  const promises = flattenedDevices.map(async (device) => {
    const values = [
      device.deviceName.trim(),
      device.availability,
      device.hubName,
      device.hubIp,
    ];

    try {
      const result = await client.query(selectQuery, [
        device.deviceName.trim(),
      ]);
      if (result.rows.length > 0) {
        try {
          await client.query(updateQuery, [
            device.deviceName.trim(),
            device.availability,
          ]);
          console.log(`Device "${device.deviceName}" updated.`);
        } catch (updateError) {
          console.error(
            `update Error = Error processing device "${device.deviceName}":`,
            updateError
          );
        }
      } else {
        try {
          await client.query(insertQuery, values);
          console.log(`Device "${device.deviceName}" inserted.`);
        } catch (insertError) {
          console.error(
            `insert Error = Error processing device "${device.deviceName}":`,
            insertError
          );
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong!" });
    }
  });

  // Wait for all Promises to complete
  try {
    // await Promise.all(promises);
    res.status(200).send({ hub_devices_data: hubDeviceData.payload });
  } catch (error) {
    console.error("Error processing devices:", error);
    res.status(500).json({ error: "Internal server error." });
  }
  // res.json(extractData(data)).status(200);
};
