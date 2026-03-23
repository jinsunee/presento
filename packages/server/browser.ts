import { $ } from "bun";
import os from "node:os";

async function isWSL(): Promise<boolean> {
  if (process.platform !== "linux") return false;
  if (os.release().toLowerCase().includes("microsoft")) return true;
  try {
    const file = Bun.file("/proc/version");
    if (await file.exists()) {
      const content = await file.text();
      return content.toLowerCase().includes("wsl") || content.toLowerCase().includes("microsoft");
    }
  } catch {}
  return false;
}

export async function openBrowser(url: string): Promise<boolean> {
  try {
    const browser = process.env.PRESENTO_BROWSER;
    const platform = process.platform;
    const wsl = await isWSL();

    if (browser) {
      if (platform === "darwin") {
        await $`open -a ${browser} ${url}`.quiet();
      } else if (platform === "win32" || wsl) {
        await $`cmd.exe /c start "" ${browser} ${url}`.quiet();
      } else {
        await $`${browser} ${url}`.quiet();
      }
    } else {
      if (platform === "win32" || wsl) {
        await $`cmd.exe /c start ${url}`.quiet();
      } else if (platform === "darwin") {
        await $`open ${url}`.quiet();
      } else {
        await $`xdg-open ${url}`.quiet();
      }
    }
    return true;
  } catch {
    return false;
  }
}
