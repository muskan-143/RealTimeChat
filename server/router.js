const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  //   res.send("server is up and running");
  res.end("server is up and  running");
});

module.exports = router;
