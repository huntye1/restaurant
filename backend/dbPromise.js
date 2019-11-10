const sqlite = require("sqlite");

module.exports = sqlite.open(__dirname + "./db/restaurant.sqlite3");