// Import the necessary modules and functions
const { addDataTerminal } = require("../controllers/vmControllers"); // Replace 'yourApiFile' with the actual file name
const client = require("../Connections/db"); // Replace '../path/to/your/client/module' with the actual path to the client module

// Mock the client module
jest.mock("../Connections/db");

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

  test("should insert a terminal and return 500 status code with error message if there is an insert error", async () => {
    // Mock the insert error
    const insertError = new Error("Insert error");
    client.query.mockImplementation((query, values, callback) => {
      callback(insertError);
    });

    // Call the API function
    await addDataTerminal(
      {
        body: {
          name: "testName",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: insertError.detail });
  });

  test("should return 400 status code with error message if the name already exists in the terminals table", async () => {
    // Mock the select result with rowCount > 0
    const selectResult = { rows: [{ name: "testName" }], rowCount: 1 };
    client.query.mockImplementation((query, values, callback) => {
      callback(null, selectResult);
    });

    // Call the API function
    await addDataTerminal(
      {
        body: {
          name: "testName",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: `Name 'testName' already exists in terminals table`,
    });
  });

  test("should return 200 status code with success message and terminal table data", async () => {
    // Mock the select result to indicate that the name doesn't exist
    const selectResult = { rows: [], rowCount: 0 };
    client.query.mockImplementationOnce((query, values, callback) => {
      callback(null, selectResult);
    });

    // Mock the insert result
    const insertResult = { rowCount: 1 };
    client.query.mockImplementationOnce((query, values, callback) => {
      callback(null, insertResult);
    });

    // Mock the terminal table result
    const terminalTable = {
      rows: [
        {
          name: "testName",
          status: "offline",
          availability: true,
          ip_address: null,
        },
      ],
    };
    client.query.mockImplementationOnce((query, callback) => {
      callback(null, terminalTable);
    });

    // Call the API function
    await addDataTerminal(
      {
        body: {
          name: "testName",
        },
      },
      res
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: "Data Added Successfully: rows=1",
      terminal_table: terminalTable.rows,
    });
  });
});
