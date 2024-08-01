"use strict";
module.exports = function (app) {
  var terminal = require("../controllers/vmControllers");
  var usbHub = require("../controllers/awController");
  var terminalBooking = require("../controllers/bookings");

  app.route("/createTable").post(terminal.createTable);
  app.route("/deleteTable").delete(terminal.deleteTable);
  app.route("/tables").get(terminal.getTables); // GET ALL TABLES IN DB

  // MQTT VM ROUTES
  app.route("/list-usb").post(terminal.getUSBDevices); // LIST USB-DEVICES FOR TERMINAL
  app.route("/list-all-terminals").get(terminal.getTerminalTable); // LIST ALL TERMINALS TABLE
  app.route("/add-terminal").post(terminal.addDataTerminal); // ADD TERMINAL IN TABLE
  app.route("/terminal-connection").put(terminal.connectTerminal); // SET CONNECTION FOR THE TERMINAL
  app.route("/online-terminals").get(terminal.getOnlineTerminal); //Get devices that are online and available
  app.route("/terminal-binding").post(terminal.bindTerminal); //BIND USB PORT

  // AW USB ROUTES
  app.route("/list-devices").get(usbHub.listDevices); // LIST USB-DEVICES FOR AWS MANAGER

  //BOOKING ROUTES
  app.route("/booking").post(terminalBooking.booking); // CREATE BOOKING
  app.route("/booking/:booking_id").put(terminalBooking.updateBooking); // UPDATE BOOKING
  app
    .route("/booking/terminal/:terminal_id")
    .get(terminalBooking.getBookingByTerminalId); // GET BOOKINGS BY TERMINAL ID
  app.route("/booking/user/:user_id").get(terminalBooking.getBookingByUserId); // GET BOOKINGS BY USER ID
  app.route("/booking/cancel").post(terminalBooking.cancelBooking); // CANCEL BOOKING
  app.route("/booking/:id").get(terminalBooking.getBookingById); // GET BOOKING BY BOOKING ID
  app.route("/bookings").get(terminalBooking.getAllBookings); // GET ALL BOOKINGS
};
