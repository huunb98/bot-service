import fs from "fs";

export class FileIO {
  private readonly fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
    if (!fs.existsSync("./logs")) fs.mkdirSync("./logs");
  }
  private currentFolder: string = "./logs/";

  private enableWriteFile: boolean = true;

  writeFile(type: "json" | "txt", data: any, logTimeStamp: boolean = true) {
    if (!this.enableWriteFile) return;

    let timeStamp = "";
    if (logTimeStamp) timeStamp = Math.round(Date.now() / 1000).toString();
    data = JSON.stringify(data);

    fs.writeFile(this.currentFolder + this.fileName + timeStamp + "." + type, data, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  }
}
