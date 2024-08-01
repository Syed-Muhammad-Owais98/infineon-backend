const { connectTerminal } = require("../controllers/vmControllers");
const client = require("../Connections/db");

// Mock the client module
jest.mock("../Connections/db");

describe("connectTerminal", () => {
  const req = {
    body: {
      id: "testId",
      connection: "connect",
    },
  };
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };

  // Reset the mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 status code with success message when connecting terminal", async () => {
    // Mock the query result
    const updateResult = {
      rows: [],
    };
    client.query.mockImplementationOnce((query, values, callback) => {
      callback(null, updateResult);
    });

    // Call the API function
    await connectTerminal(req, res);

    expect(client.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([expect.any(Boolean), expect.any(String)]),
      expect.any(Function)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "The Device is Connected",
      device_id: "testId",
    });
  });

  test("should return 200 status code with success message when disconnecting terminal", async () => {
    // Update the request body
    req.body.connection = "disconnect";

    // Mock the query result
    const updateResult = {
      rows: [],
    };
    client.query.mockImplementationOnce((query, values, callback) => {
      callback(null, updateResult);
    });

    // Call the API function
    await connectTerminal(req, res);

    expect(client.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([expect.any(Boolean), expect.any(String)]),
      expect.any(Function)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "The Device is Disconnected",
      device_id: "testId",
    });
  });

  test("should return 400 status code with error message if id is missing", async () => {
    // Call the API function
    await connectTerminal(
      {
        body: {
          id: null,
          connection: "connect",
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Bad Request: The "id" field is required.',
    });
  });

  test("should return 400 status code with error message if connection is missing", async () => {
    // Call the API function
    await connectTerminal(
      {
        body: {
          id: "testId",
          connection: null,
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Bad Request: The "connection" field is required.',
    });
  });

  test("should return 500 status code with error message on update query error", async () => {
    // Mock the query error
    const updateError = new Error("Update query error");
    client.query.mockImplementationOnce((query, values, callback) => {
      callback(updateError);
    });

    // Call the API function
    await connectTerminal(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(updateError);
  });

  // Add more test cases as needed
});
