const fs = require("fs");
export default function logAsset(fileName: string) {
  try {
    const data = fs.readFileSync("./src/asset/" + fileName, "utf8");
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
