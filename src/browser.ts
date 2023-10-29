import { spawn } from "node:child_process";

export async function isRemoteDebuggerChromeAvailable(portNumber: number): Promise<boolean> {
  const res = await fetch(`http://127.0.0.1:${portNumber}/json/version`).catch(() => {});
  if (!res) {
    return false;
  }

  const data = await res.json();
  return data.Browser.includes("Chrome");
}

export async function launchChrome() {
  spawn(process.env.CHROME_EXE_PATH as string, ["--remote-debugging-port=9222"]);
}

export async function didChromeLaunch(portNumber): Promise<boolean> {
  for (var i = 0; i < 5; i++) {
    if (await isRemoteDebuggerChromeAvailable(portNumber)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}
