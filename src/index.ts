import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { Authenticate } from "./auth/Authenticate";
import { TelegramBotService } from "./telegram/TelegramService";
import logAsset from "./utils/LogAsset";

require("dotenv").config({ path: __dirname + "/../.env" });

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.get("/", (req, res) => {
  res.send("OK");
});

const telegramBot = new TelegramBotService().getBotService();

app.post("", (req, res) => {
  const message: TelegramBot.Message = req.body.message;
  if (message) telegramBot.onNewUpdate(message);
  res.sendStatus(200);
});

app.post("/webhook", (req, res) => {
  console.log(req.body);
  res.sendStatus(200);
});

app.post("/telegram", Authenticate, (req, res) => {
  const { chatId, message } = req.body;
  console.log(chatId, message);
  if (!chatId || !message) return res.status(404).json({ message: "ChatId or Message not valid" });

  telegramBot.sendMsgToGroup(chatId, message, (error, message) => {
    if (error) return res.status(500).json({ message: error });
    return res.json({ message: message });
  });
});

app.listen(port, function () {
  console.log(`Example app listening on port`, port);
  logAsset("alpaca.txt");
});
