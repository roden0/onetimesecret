const express = require("express");
const fs = require("fs");
const app = express();
const CryptoJS = require("crypto-js");
const JsonFormatter = require("./parser");

const PHRASE = "my secret passphrase";
const DOMAIN = process.env.DOMAIN;
const PORT = process.env.PORT;

app.use(express.json());

app.get("*", function (req, res) {
  const name = req.originalUrl.substr(1);
  const path = `./${name}.txt`;

  fs.exists(path, (exists) => {
    if (exists) {
      fs.readFile(path, (err, data) => {
        const content = data.toString();
        const secret = CryptoJS.AES.decrypt(content, PHRASE, {
          format: JsonFormatter
        });
        fs.unlink(path, () => {
          res.send({ secret: secret.toString(CryptoJS.enc.Utf8) });
        });
      });
    } else {
      res.status(404).send("Not found");
    }
  });
});

app.post("/", function (req, res) {
  const { body } = req;
  const { secret } = body;
  const encrypted = CryptoJS.AES.encrypt(secret, PHRASE, {
    format: JsonFormatter
  });
  const fileName = encrypted.salt;

  fs.writeFile(`./${fileName}.txt`, encrypted.toString(), () => {
    res.json({
      secretURL: `${DOMAIN}/${fileName}`
    });
  });
});

app.listen(PORT);
