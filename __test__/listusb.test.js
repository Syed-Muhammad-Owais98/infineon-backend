const { getUSBDevices } = require("../controllers/vmControllers"); // Replace 'yourApiFile' with the actual file name
const client = require("../Connections/db"); // Replace '../path/to/your/client/module' with the actual path to the client module
// Mock the client module
jest.mock("../Connections/db");

// Mock the MQTT client
const mqttClient = {
  subscribe: jest.fn((topic, callback) => {
    // Simulate successful subscription
    callback(null, {});
  }),
  once: jest.fn((event, callback) => {
    // Simulate receiving a message
    callback(
      `vmid_123_USBDevices`,
      JSON.stringify({
        available_devices: ["device1", "device2"],
        hostname: "example-host",
      })
    );
  }),
  publish: jest.fn((topic, message, callback) => {
    // Simulate successful publish
    callback(null);
  }),
};

describe("Add terminal", () => {
  // Mock the response object
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };

  // Reset the mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 status code with error message if hostname field is missing or empty", async () => {
    // Mock the request object with a missing or empty hostname field
    const req = {
      body: {
        // hostname field is missing or empty
      },
    };

    // Call the API function
    await getUSBDevices(req, res);

    // Check the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Bad Request: The "hostname" field is required.',
    });
  });

  //   test("should subscribe to USB devices topic, receive message, and send the response", async () => {
  //     // Mock the request object with a valid hostname
  //     const req = {
  //       body: {
  //         hostname: "testHostname",
  //       },
  //     };

  //     // Mock the MQTT functions
  //     const mqttClient = {
  //       subscribe: jest.fn((topic, options, callback) => {
  //         callback(null, {});
  //       }),
  //       publish: jest.fn((topic, message, callback) => {
  //         callback(null);
  //       }),
  //       once: jest.fn((event, callback) => {
  //         // Simulate receiving a message
  //         if (event === "message") {
  //           const topic = `vmid_testMacAddress_USBDevices`;
  //           const message = JSON.stringify({
  //             available_devices: [
  //               {
  //                 BUSID: "1-5",
  //                 "VID:PID": "0000:0000",
  //                 DEVICE: "device2",
  //                 STATE: "Not shared",
  //               },
  //               {
  //                 BUSID: "1-7",
  //                 "VID:PID": "2222:1111",
  //                 DEVICE: "device1",
  //                 STATE: "Not shared",
  //               },
  //             ],
  //             hostname: "testHostname",
  //           });
  //           callback(topic, message);
  //         }
  //       }),
  //     };

  //     // Call the API function
  //     await getUSBDevices(req, res, mqttClient);

  //     // Check the response
  //     expect(res.status).toHaveBeenCalledWith(200);
  //     expect(res.send).toHaveBeenCalledWith({
  //       usbList: [
  //         {
  //           BUSID: "1-5",
  //           "VID:PID": "0000:0000",
  //           DEVICE: "device2",
  //           STATE: "Not shared",
  //         },
  //         {
  //           BUSID: "1-7",
  //           "VID:PID": "2222:1111",
  //           DEVICE: "device1",
  //           STATE: "Not shared",
  //         },
  //       ],
  //       host_name: "testHostname",
  //     });
  //   });

  test("should return 404 response when terminal does not exist in data", async () => {
    // Mock the select result to indicate that the name doesn't exist
    const selectResult = { rows: [], rowCount: 0 };
    client.query.mockImplementation((query, values, callback) => {
      callback(null, selectResult);
    });

    // Mock the response object
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    // Call the API function
    await getUSBDevices(
      {
        body: {
          hostname: "nonExistingTerminal",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      message: "'nonExistingTerminal' terminal does not exist in data",
    });
  });
});
