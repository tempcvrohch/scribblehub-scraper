import { Page, ElementHandle } from "puppeteer-core";
import { Book } from "./book.js";

export const ParagraphSelector = ".chp_raw";
export enum NextChapterAvailabilityState {
  AVAILABLE,
  LOCKED,
  NONE,
}
export async function getNextPageDisabledHandle(
  page: Page
): Promise<ElementHandle<Element> | null> {
  return page.$(".btn-wi.btn-next.disabled");
}

export async function getNextPageHandle(
  page: Page
): Promise<ElementHandle<Element> | null> {
  return page.$(".btn-wi.btn-next");
}

export async function getChapterAvailabilityState(
  page: Page
): Promise<NextChapterAvailabilityState> {
  let nextPageHandle = await getNextPageHandle(page);
  let nextPageDisabledHandle = await getNextPageDisabledHandle(page);

  if (nextPageHandle && !nextPageDisabledHandle) {
    return NextChapterAvailabilityState.AVAILABLE;
  } else if (nextPageHandle && nextPageDisabledHandle) {
    return NextChapterAvailabilityState.LOCKED;
  } else {
    return NextChapterAvailabilityState.NONE;
  }
}

export async function navigateToNextChapter(
  page: Page,
  paragraphSelector: string,
	timeout? : number
) {
  let nextPageHandle = await getNextPageHandle(page);
  if (!nextPageHandle) {
    throw Error("State error: expected nextPageHandle");
  }
  await nextPageHandle.click();

  await new Promise((a) => setTimeout(a, timeout ? timeout : 5000));
  await page.waitForSelector(paragraphSelector);
}

export async function lookupBookProperties(page: Page): Promise<Book> {
  return {
    title:
      (await page.$eval(
        ".chp_byauthor a:nth-child(1)",
        (el) => el.textContent
      )) || "Unknown title",
    author:
      (await page.$eval(
        ".chp_byauthor a:nth-child(2)",
        (el) => el.textContent
      )) || "Unknown author",
    lastChapterURL: await page.url(),
    chapters: [],
  };
}

export async function scrapeChapter(page: Page): Promise<string> {
  await page.waitForSelector(ParagraphSelector);
  const chapterTitle =
    (await page.$eval(".chapter-title", (el) => el.textContent)) ||
    "Unknown chapter";

  let chapterText = `<h1>${chapterTitle}</h1>`;
  chapterText += await page.evaluate((paragraphSelector) => {
    const pars = document.querySelectorAll(paragraphSelector);

    let chapterText = ``;
    pars.forEach((par) => {
      chapterText += `<p>${par.textContent}</p>\n\n`;
    });

    return chapterText;
  }, `${ParagraphSelector} > p`);

  return chapterText;
}
