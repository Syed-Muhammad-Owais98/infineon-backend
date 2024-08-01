const client = require("../Connections/db");

exports.booking = async (req, res) => {
  const { userId, terminalId, start_date, end_date } = req.body;
  if (userId === null || userId === undefined || userId === 0) {
    res
      .status(400)
      .send({ error: 'Bad Request: The "userID" field is required.' });
    return;
  }
  if (terminalId === null || terminalId === undefined || terminalId === 0) {
    res
      .status(400)
      .send({ error: 'Bad Request: The "terminalID" field is required.' });
    return;
  }
  if (start_date === null || start_date === undefined || start_date === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "start_date" field is required.' });
    return;
  }
  if (end_date === null || end_date === undefined || end_date === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "end_date" field is required.' });
    return;
  }

  client.query(
    `
    SELECT * FROM bookings WHERE terminal_id = $1
  `,
    [terminalId],
    (updateErr, updateRes) => {
      if (updateErr) {
        res.status(500).send(updateErr);
        return;
      }
      if (updateRes.rows.length > 0) {
        let terminalDates = [];
        updateRes.rows.map((data) => {
          if (data.status === 1) {
            terminalDates.push({
              book_start: data.start_date,
              book_end: data.end_date,
            });
            return;
          }
        });

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        let isOutsideAllRanges = terminalDates.every(
          ({ book_start, book_end }) => {
            const start = new Date(book_start);
            const end = new Date(book_end);

            return endDate <= start || startDate >= end;
          }
        );

        if (isOutsideAllRanges) {
          const book_start_date = new Date(start_date).toISOString();
          const book_end_date = new Date(end_date).toISOString();
          client.query(
            `INSERT INTO bookings (user_id, terminal_id, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, terminalId, 1, book_start_date, book_end_date],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error(insertErr);
                res.status(500).send({ message: insertErr.detail });
              } else {
                res.status(200).send({
                  message: "Booking has been added",
                  data: insertResult.rows[0],
                });
              }
            }
          );
        } else {
          res.status(409).send({
            message: "Date you provide is already booked for the terminal",
          });
        }
      } else {
        const book_start_date = new Date(start_date).toISOString();
        const book_end_date = new Date(end_date).toISOString();
        client.query(
          `INSERT INTO bookings (user_id, terminal_id, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [userId, terminalId, 1, book_start_date, book_end_date],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error(insertErr);
              res.status(500).send({ message: insertErr.detail });
            } else {
              res.status(200).send({
                message: "Booking has been added",
                data: insertResult.rows[0],
              });
            }
          }
        );
      }
    }
  );
};

exports.updateBooking = async (req, res) => {
  const { start_date, end_date } = req.body;
  const { booking_id } = req.params;
  if (booking_id === null || booking_id === undefined || booking_id === 0) {
    res
      .status(400)
      .send({ error: 'Bad Request: The "booking_id" is required.' });
    return;
  }
  if (start_date === null || start_date === undefined || start_date === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "start_date" field is required.' });
    return;
  }
  if (end_date === null || end_date === undefined || end_date === "") {
    res
      .status(400)
      .send({ error: 'Bad Request: The "end_date" field is required.' });
    return;
  }
  let booking = [];
  client.query(
    `
    SELECT * FROM bookings WHERE id = $1
  `,
    [booking_id],
    (updateErr, updateRes) => {
      if (updateErr) {
        console.log(updateErr);
        res.status(500).send(updateErr);
        return;
      }
      if (updateRes.rows.length > 0) {
        if (updateRes.rows[0].status === 1) {
          booking.push(updateRes.rows[0]);
          client.query(
            `
            SELECT * FROM bookings WHERE terminal_id = $1 AND id <> $2;
          `,
            [updateRes.rows[0].terminal_id, booking_id],
            (allTerminalError, allTerminalRes) => {
              if (allTerminalError) {
                res.status(500).send(allTerminalError);
                return;
              }
              if (allTerminalRes.rows.length > 0) {
                let terminalDates = [];
                allTerminalRes.rows.map((data) => {
                  if (data.status === 1) {
                    terminalDates.push({
                      book_start: data.start_date,
                      book_end: data.end_date,
                    });
                    return;
                  }
                });
                const startDate = new Date(start_date);
                const endDate = new Date(end_date);

                let isOutsideAllRanges = terminalDates.every(
                  ({ book_start, book_end }) => {
                    const start = new Date(book_start);
                    const end = new Date(book_end);

                    return endDate <= start || startDate >= end;
                  }
                );

                if (isOutsideAllRanges) {
                  const book_start_date = new Date(start_date).toISOString();
                  const book_end_date = new Date(end_date).toISOString();
                  client.query(
                    `UPDATE bookings SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING *`,
                    [book_start_date, book_end_date, booking_id],
                    (insertErr, insertResult) => {
                      if (insertErr) {
                        res.status(500).send({ message: insertErr.detail });
                      } else {
                        res.status(200).send({
                          message: "Booking has been updated",
                          data: insertResult.rows[0],
                        });
                      }
                    }
                  );
                } else {
                  res.status(409).send({
                    message:
                      "Date you provide is already booked for the terminal",
                  });
                }
              } else {
                const book_start_date = new Date(start_date).toISOString();
                const book_end_date = new Date(end_date).toISOString();
                client.query(
                  `UPDATE bookings SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING *`,
                  [book_start_date, book_end_date, booking_id],
                  (insertErr, insertResult) => {
                    if (insertErr) {
                      console.error(insertErr);
                      res.status(500).send({ message: insertErr.detail });
                    } else {
                      res.status(200).send({
                        message: "Booking has been Updated",
                        data: insertResult.rows[0],
                      });
                    }
                  }
                );
              }
            }
          );
        } else {
          res.status(404).send({
            error: `Booking with id ${booking_id} is already cancelled or expired.`,
          });
        }
      } else {
        res
          .status(404)
          .send({ error: `Booking with id ${booking_id} not found.` });
      }
    }
  );
};

exports.getBookingByTerminalId = async (req, res) => {
  const { terminal_id } = req.params;
  client.query(
    "SELECT * FROM terminals WHERE id = $1",
    [terminal_id],
    (validateErr, validateRes) => {
      if (validateErr) {
        res.status(500).send({ error: "Internal Server Error" });
        return;
      }

      if (validateRes.rows.length > 0) {
        client.query(
          "SELECT * FROM bookings WHERE terminal_id = $1",
          [terminal_id],
          (getErr, getRes) => {
            if (getErr) {
              res.status(500).send({ error: getErr.detail });
              return;
            }

            if (getRes.rows.length > 0) {
              res.status(200).send({ data: getRes.rows });
            } else {
              res.status(200).send({ data: [] });
            }
          }
        );
      } else {
        res.status(404).send({ error: "Terminal not found" });
      }
    }
  );
};

exports.getBookingByUserId = async (req, res) => {
  const { user_id } = req.params;
  client.query(
    "SELECT * FROM users WHERE id = $1",
    [user_id],
    (validateErr, validateRes) => {
      if (validateErr) {
        res.status(500).send({ error: "Internal Server Error" });
        return;
      }

      if (validateRes.rows.length > 0) {
        client.query(
          "SELECT * FROM bookings WHERE user_id = $1",
          [user_id],
          (getErr, getRes) => {
            if (getErr) {
              res.status(500).send({ error: getErr.detail });
              return;
            }

            if (getRes.rows.length > 0) {
              res.status(200).send({ data: getRes.rows });
            } else {
              res.status(200).send({ data: [] });
            }
          }
        );
      } else {
        res.status(404).send({ error: "User not found" });
      }
    }
  );
};

exports.getBookingById = async (req, res) => {
  const { id } = req.params;
  client.query(
    "SELECT * FROM bookings WHERE id = $1 and status = $2",
    [id, 1],
    (getErr, getRes) => {
      if (getErr) {
        res.status(500).send({ error: "Internal Server Error" });
        return;
      }

      if (getRes.rows.length > 0) {
        res.status(200).send({ data: getRes.rows[0] });
      } else {
        res
          .status(404)
          .send({ message: "Booking has either cancelled or not found!" });
      }
    }
  );
};

exports.cancelBooking = async (req, res) => {
  const { id } = req.body;
  if (id === null || id === undefined || id === 0) {
    res.status(400).send({ error: 'Bad Request: The "id" field is required.' });
    return;
  }
  client.query(
    "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
    [0, id],
    (getErr, getRes) => {
      if (getErr) {
        res.status(500).send({ error: "Internal Server Error" });
        return;
      }

      if (getRes.rows.length > 0) {
        res.status(200).send({
          message: "Booking has been cancelled",
          data: getRes.rows[0],
        });
      } else {
        res.status(404).send({ message: "Booking does not exist" });
      }
    }
  );
};

exports.getAllBookings = async (req, res) => {
  client.query(
    "SELECT * FROM bookings WHERE status = $1",
    [1],
    (getErr, getRes) => {
      if (getErr) {
        res.status(500).send({ error: "Internal Server Error" });
        return;
      }

      if (getRes.rows.length > 0) {
        res.status(200).send({ data: getRes.rows });
      } else {
        res.status(200).send({ data: [] });
      }
    }
  );
};
