// Import the necessary modules and functions
const { bindTerminal } = require("../controllers/vmControllers"); // Replace 'yourApiFile' with the actual file name
const client = require("../Connections/db"); // Replace '../path/to/your/client/module' with the actual path to the client module
const { mqttClient } = require("../Connections/mqtt");

// Mock the client module
jest.mock("../Connections/db");
jest.mock("../Connections/mqtt", () => {
  return {
    mqttClient: {
      publish: jest.fn(),
      subscribe: jest.fn(),
    },
  };
});

describe("bindTerminal", () => {
  // Mock the response object
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };

  // Reset the mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 status code with error message if busId is missing", async () => {
    // Call the API function with missing busId
    await bindTerminal(
      {
        body: {
          deviceId: "testDeviceId",
          action: "bind",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Bad Request: The "busId" field is required.',
    });
  });

  test("should return 400 status code with error message if deviceId is missing", async () => {
    // Call the API function with missing deviceId
    await bindTerminal(
      {
        body: {
          busId: "testBusId",
          action: "bind",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Bad Request: The "deviceId" field is required.',
    });
  });

  test("should return 400 status code with error message if action is missing", async () => {
    // Call the API function with missing action
    await bindTerminal(
      {
        body: {
          busId: "testBusId",
          deviceId: "testDeviceId",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Bad Request: The "action" field is required.',
    });
  });

  test('should return 422 status code with error message if action is neither "bind" nor "unbind"', async () => {
    // Call the API function with an invalid action
    await bindTerminal(
      {
        body: {
          busId: "testBusId",
          deviceId: "testDeviceId",
          action: "invalidAction",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.send).toHaveBeenCalledWith({
      error: "'action' field value can either be 'bind' or 'unbind'.",
    });
  });

  test("should return 404 status code with error message if the device does not exist", async () => {
    // Mock the query result to return an empty rows array
    const selectResult = { rows: [] };
    client.query.mockImplementation((query, values, callback) => {
      callback(null, selectResult);
    });

    // Call the API function
    await bindTerminal(
      {
        body: {
          busId: "testBusId",
          deviceId: "testDeviceId",
          action: "bind",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      error: `'testDeviceId' terminal does not exist in data`,
    });
  });

  test.skip("should return 200 if the terminal exists and publish is successful", async () => {
    // Mock mqttClient.publish() to succeed
    const publishMock = jest
      .fn()
      .mockImplementation((topic, message, callback) => {
        callback(null); // Simulate a successful publish
      });
    mqttClient.publish = publishMock;

    await bindTerminal(
      {
        body: {
          busId: "testBusId",
          deviceId: "testDeviceId",
          action: "bind",
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith();
    expect(publishMock).toHaveBeenCalledWith(
      `bind_deviceId`,
      expect.any(String),
      expect.any(Function)
    );
  });
});
