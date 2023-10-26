import "dotenv/config";
import Scraper from "./src/scraper.js";
import { platform, homedir } from "os";
import { join } from "path";
import { spawnSync, spawn } from "node:child_process";

if (!process.env.CHROME_EXE_PATH) {
  throw new Error("CHROME_EXE_PATH was not found in .env file.");
}

if (!process.env.CHAPTER1_URL) {
  throw new Error("CHAPTER1_URL was not found in .env file.");
}

const browserUrl = "http://127.0.0.1:9222";
const pageUrl = process.env.CHAPTER1_URL as string;

async function main() {
  const scraper = new Scraper(browserUrl, pageUrl);
  await scraper.loadBrowser();
	console.log("Connected to browser.");

  const pageWasPreviouslyOpened = await scraper.openPageIfNeeded();
	console.log("Book page opened.");
  await scraper.startScrape();

  if (!pageWasPreviouslyOpened) {
    await scraper.unloadBrowser();
  }
}
function spawnChrome() {
  const childProcess = spawn(process.env.CHROME_EXE_PATH as string, [
    "--remote-debugging-port=9222",
    `--user-data-dir="${getChromeUserDataDirectory()}"`,
  ]);

  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  childProcess.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
  });
}

function getChromeUserDataDirectory(): string | undefined {
  switch (platform()) {
    case "darwin": // macOS
      return join(homedir(), "Library", "Application Support", "Google", "Chrome");
    case "win32": // Windows
      return join(homedir(), "AppData", "Local", "Google", "Chrome", "User Data");
    case "linux": // Linux
      return join(homedir(), ".config", "google-chrome");
    default:
      return undefined;
  }
}

main();
