# ScribblehubScraper

> As the title projectname states, a scraper for scribblehub.
> Launches a headful chrome client that automatically scrapes up to the newest chapter and packages it in a HTML file.
> The HTML file can be converted to a proper e-book file with Calibre.

#### Features

- Resume from the last scraped chapter and continue.

#### Planned Features

- Invoke Calibre directly

#### Requirements

- Windows(code supports other OS but is untested)
- Chrome
- Node - Latest TLS

#### Usage

Open `.env` and edit both `CHAPTER1_URL=` and `CHROME_EXE_PATH=`, then run `node bin/index.js`;

#### Example .env

```
CHAPTER1_URL=https://www.scribblehub.com/read/413997-the-young-master-in-the-shadows/chapter/414024/
CHROME_EXE_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
```

#### Notes

This tool was made for my own personal usage, make sure to disable any adblock when running it!