import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export const BaseBookPath = "tmp";

export class BookFileHandler {
  bookPath: string;
  bookTitle: string;

  constructor(bookTitle: string) {
    this.bookTitle = bookTitle;
    this.bookPath = getBookPath(bookTitle);
  }

  writeMetaFile(book: Book) {
    const meta = Object.assign({}, book);
    meta.chapters = []; //don't write the entire book to the meta file.
    writeFileSync(
      join(this.bookPath, cleanIllegalCharacters(this.bookTitle) + ".json"),
      JSON.stringify(meta)
    );
  }

  writeChapter(chapterIndex: number, chapter: string) {
    writeFileSync(join(this.bookPath, chapterIndex + ".txt"), chapter, {});
  }

  writeFullBook(bookChapters: string[]) {
    writeFileSync(
      join(this.bookPath, `${cleanIllegalCharacters(this.bookTitle)}.html`),
      `
      <body>
        ${bookChapters.join(`\n\n`)}
      </body>
    `
    );
  }
}

export function prepareBookDirectory(book: Book) {
  mkdirSync(join(BaseBookPath, cleanIllegalCharacters(book.title)));
}

export function writeMetaFile(book: Book) {
  writeFileSync(
    join(getBookPath(book.title), cleanIllegalCharacters(book.title) + `.json`),
    JSON.stringify(book)
  );
}

export function loadExistintChapters(book: Book) {
  return readdirSync(getBookPath(book.title))
    .filter((chapterFileName) => chapterFileName.includes(".txt"))
    .sort((a, b) => +a.replace(".txt", "") - +b.replace(".txt", ""))
    .map((chapterFileName) => {
      return readFileSync(join(getBookPath(book.title), chapterFileName), {
        encoding: "utf8",
      });
    });
}

export function getBookPath(bookTitle: string): string {
  return join(BaseBookPath, cleanIllegalCharacters(bookTitle));
}

export function hasPreviousScrape(bookPath, bookTitle): boolean {
  const dirs = readdirSync(BaseBookPath);
  if (!dirs.includes(cleanIllegalCharacters(bookTitle))) {
    return false;
  }

  const files = readdirSync(bookPath);
  return files.includes(cleanIllegalCharacters(bookTitle) + ".json");
}

export function loadExistingBook(bookPath, bookTitle): Book {
  const file = readFileSync(join(bookPath, cleanIllegalCharacters(bookTitle) + `.json`), {
    encoding: "utf8",
  });
  const book: Book = JSON.parse(file);

  if (!isValidMetaFile(book)) {
    throw new Error("Malformed meta file for book: " + bookTitle);
  }

  book.chapters = loadExistintChapters(book);
  if (book.chapters.length === 0) {
    throw new Error("No chapters found for book: " + bookTitle);
  }

  return book;
}

export function isValidMetaFile(book: Book): boolean {
  return (
    !!book.title &&
    !!book.author &&
    !!book.lastChapterURL &&
    book.title.length !== 0 &&
    book.author.length !== 0 &&
    book.lastChapterURL.length !== 0
  );
}

export function cleanIllegalCharacters(filename: string): string {
  return filename.replace(/[^A-Za-z0-9_]/g, "_");
}
