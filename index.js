const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send({ code: 202 });
});

router.post("/", (req, res) => {
  console.log(req.body);
});
app.listen(process.env.PORT || 3000);
