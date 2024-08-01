// Import the necessary modules and functions
const { getOnlineTerminal } = require("../controllers/vmControllers"); // Replace 'yourApiFile' with the actual file name
const client = require("../Connections/db"); // Replace '../path/to/your/client/module' with the actual path to the client module

// Mock the client module
jest.mock("../Connections/db");

describe("getOnlineTerminal", () => {
  // Mock the request and response objects
  const req = {};
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };

  // Reset the mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should retrieve online terminals and return 200 status code with devices", async () => {
    // Mock the query result
    const queryResult = {
      rows: [
        { id: 1, name: "Terminal 1" },
        { id: 2, name: "Terminal 2" },
      ],
    };
    client.query.mockResolvedValueOnce(queryResult);

    // Call the API function
    await getOnlineTerminal(req, res);

    // Check the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ devices: queryResult.rows });
  });
});
