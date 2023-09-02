import "dotenv/config";
import puppeteer, { Page, TargetType } from "puppeteer-core";
import { writeFileSync } from "fs";

if (!process.env.CHAPTER1_URL) {
  throw new Error("CHAPTER1_URL is needed in .env file.");
}

(async () => {
  //const browser = await puppeteer.launch({
  //headless: false,
  //ignoreDefaultArgs: ['--enable-automation'],
  //executablePath: `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`
  //});

  const browserUrl = "http://127.0.0.1:9222";
  const pageUrl = process.env.CHAPTER1_URL as string;

  const browser = await puppeteer.connect({
    browserURL: browserUrl,
    defaultViewport: null,
  });

  const paragraphSelector = ".chp_raw";
  const targets = await browser.targets();
  let page: Page | null = null;
  let isPageOpenInSession = false;
  let chapterIndex: number = 1;

  for (let target of targets) {
    if (target.type() === TargetType.PAGE) {
      let targetPage = await target.page();
      if (targetPage?.url().includes(pageUrl)) {
        page = targetPage;
        isPageOpenInSession = true;
        break;
      }
    }
  }

  if (!page) {
    console.log("Page not opened in current session, opening...");
    page = await browser.newPage();
    //await page.target().send('Emulation.clearDeviceMetricsOverride');
    await page.setViewport({ width: 0, height: 0 });
    await page.goto(pageUrl);
  }

  async function scrapeChapter(page: Page, chapterIndex: number) {
    await page.waitForSelector(paragraphSelector);
    const chapterTitle = await page.$eval(
      ".chapter-title",
      (el) => el.textContent
    );

    const chapterText = await page.evaluate((paragraphSelector) => {
      const pars = document.querySelectorAll(paragraphSelector);
      console.log(`Chapter title:`, pars[0].textContent);

      let chapterText = "";
      pars.forEach((par) => {
        chapterText += par.textContent + `\n\n`;
      });

      return chapterText;
    }, `${paragraphSelector} > p`);

    console.log(chapterText);

    writeFileSync(`tmp\\${chapterIndex} - ${chapterTitle?.replace(/[^A-Za-z0-9_.]*/g, '_')}.txt`, chapterText);
  }

  while (true) {
    try {
      await scrapeChapter(page, chapterIndex++);

      let nextPageHandle = await page.$(".btn-wi.btn-next");
      if (nextPageHandle) {
        await nextPageHandle.click();

        await new Promise((a) => setTimeout(a, 5000));
        await page.waitForSelector(paragraphSelector);
      } else {
        break;
      }
    } catch (e) {
      console.log(e);
    }
    //chapter-title
    //btn-wi btn-next
  }

  if (!isPageOpenInSession) {
    await page.close();
  }

  await browser.disconnect();
})();

//btn-wi btn-next
