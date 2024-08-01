const { getTerminalTable } = require("../controllers/vmControllers"); // Replace 'yourApiFile' with the actual file name
const client = require("../Connections/db"); // Replace '../path/to/your/client/module' with the actual path to the client module

// Mock the client module
jest.mock("../Connections/db");

describe("getTerminalTable", () => {
  const req = {};
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };

  // Reset the mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 status code with terminal table data", async () => {
    const queryResult = {
      rows: [
        { id: 1, name: "Terminal 1" },
        { id: 2, name: "Terminal 2" },
      ],
    };
    client.query.mockImplementationOnce((query, callback) =>
      callback(null, queryResult)
    );

    // Call the API function
    await getTerminalTable(req, res);

    expect(client.query).toHaveBeenCalledWith(
      "SELECT * FROM terminals",
      expect.any(Function)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(queryResult.rows);
  });

  // Add more test cases as needed
});
