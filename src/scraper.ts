import puppeteer, { Page, TargetType, Browser } from "puppeteer-core";
import {
  NextChapterAvailabilityState,
  ParagraphSelector,
  getChapterAvailabilityState,
  lookupBookProperties,
  navigateToNextChapter,
  scrapeChapter,
} from "./scribblehub.js";
import {
  BookFileHandler,
  getBookPath,
  hasPreviousScrape,
  loadExistingBook,
  prepareBookDirectory,
} from "./book-file-handler.js";

export default class Scraper {
  private page: Page;
  private browser: Browser;
  private browserURL: string;
  private pageURL: string;

  constructor(browserURL: string, pageURL: string) {
    this.browserURL = browserURL;
    this.pageURL = pageURL;
  }

  async loadBrowser() {
    this.browser = await puppeteer.connect({
      browserURL: this.browserURL,
      defaultViewport: null,
			protocolTimeout: 200_000,
    });
  }

  async unloadBrowser() {
    return this.browser.close();
  }

  async navigate(url: string) {
    await this.page.goto(url);
    await this.page.waitForSelector(ParagraphSelector);
  }

  /**
   *
   * @returns wether the page was opened for this session.
   */
  async openPageIfNeeded(): Promise<boolean> {
    const targets = await this.browser.targets();
    for (let target of targets) {
      if (target.type() === TargetType.PAGE) {
        let targetPage = await target.page();
        if (targetPage?.url().includes(this.pageURL)) {
          this.page = targetPage;
          break;
        }
      }
    }

    if (!this.page) {
      console.log("Page not opened in current session, opening...");
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 0, height: 0 });
      await this.navigate(this.pageURL);

      return false;
    }

    return true;
  }

  async startScrape() {
		const navTimeout = getNavTimeout();
		console.log(`Using navigation timeout: ${navTimeout}`);

    let book = await lookupBookProperties(this.page);
    const bookPath = getBookPath(book.title);
    let chapterIndex = 0;

    if (hasPreviousScrape(bookPath, book.title)) {
      book = loadExistingBook(bookPath, book.title);
      console.log(
        "Previous progress found for book, continueing at chapter: " + book.chapters.length + "."
      );
      await this.navigate(book.lastChapterURL);
      chapterIndex = book.chapters.length; //continue at currentIndex + 1
      if (
        (await getChapterAvailabilityState(this.page)) === NextChapterAvailabilityState.AVAILABLE
      ) {
        await navigateToNextChapter(this.page, ParagraphSelector, navTimeout);
      }
    } else {
      console.log("Creating directory for: " + book.title + ".");
      prepareBookDirectory(book);
    }

    const bookFileHandler = new BookFileHandler(book.title);

    while (true) {
      const chapterText = await scrapeChapter(this.page);
      bookFileHandler.writeChapter(chapterIndex++, chapterText);
      console.log(`Chapter ${chapterIndex - 1} written.`);
      book.lastChapterURL = this.page.url();
      bookFileHandler.writeMetaFile(book);

      switch (await getChapterAvailabilityState(this.page)) {
        case NextChapterAvailabilityState.AVAILABLE: {
          console.log("Next chapter available, navigating...");
          await navigateToNextChapter(this.page, ParagraphSelector, navTimeout);
          console.log("Navigation complete.");
          break;
        }
        case NextChapterAvailabilityState.LOCKED: {
          console.log("Next chapter is unavailable, writing full book...");
          bookFileHandler.writeFullBook(book.chapters);
          bookFileHandler.writeMetaFile(book);
          console.log("Book written!");
          return;
        }
        case NextChapterAvailabilityState.NONE: {
          throw new Error("Invalid state, should be on a chapter page.");
        }
      }
    }
  }
}

export function getNavTimeout(): number {
	const timeout:number  = process.env.NAV_TIMEOUT ? +process.env.NAV_TIMEOUT : 5000;
	return timeout > 2000 ? timeout : 2000;
}
