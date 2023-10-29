import "dotenv/config";
import Scraper from "./src/scraper.js";
import { didChromeLaunch, isRemoteDebuggerChromeAvailable, launchChrome } from "./src/browser.js";
import { ensureTmpDir } from "./src/book-file-handler.js";

if (!process.env.CHROME_EXE_PATH) {
  throw new Error("CHROME_EXE_PATH was not found in .env file.");
}

if (!process.env.CHAPTER1_URL) {
  throw new Error("CHAPTER1_URL was not found in .env file.");
}

const portNumber = 9222;
const browserUrl = "http://127.0.0.1:" + portNumber;
const pageUrl = process.env.CHAPTER1_URL as string;

async function main() {
	ensureTmpDir();

  if (!(await isRemoteDebuggerChromeAvailable(portNumber))) {
    launchChrome();
  }
	
  if (!(await didChromeLaunch(portNumber))) {
    throw new Error(
      "Could not start chrome in remote debugging mode, make sure every instance of chrome is terminated before running this tool."
    );
  }

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

main();
