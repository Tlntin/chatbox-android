// import * as api from '@tauri-apps/api'
// import { Store } from "@tauri-apps/plugin-store";
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
// import { readTextFile, writeFile, Dir } from "@tauri-apps/plugin-fs";
// const store = new Store('config.json')
let store:any = {};
// const config_path = Dir.LocalData + "/chatbox/config.json";

setInterval(async () => {
    try {
        // await store.save()
        await Filesystem.writeFile({
          path: 'config.json',
          data: JSON.stringify(store),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        console.log("intevel save ok");

    } catch (e) {
        console.log(e)
    }
}, 5 * 60 * 1000)

export const writeStore = async (key: string, value: any) => {
    // await store.set(key, value)
    store[key] = value;
    if (key === 'settings') {
        // await store.save()
        await Filesystem.writeFile({
            path: 'config.json',
            data: JSON.stringify(store),
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
        });
        console.log("setting save ok");
    }
}

export const readStore = async (key: string): Promise<any | undefined> => {
    await handleCompatibilityV0_1()
    // const value = await store.get(key)
    const value = await store[key]
    return value || undefined
}

async function handleCompatibilityV0_1() {
    // 第一次启动时，将旧版本的配置文件迁移到新的配置文件中
    try {
        // const handled = await store.get('hasHandleCompatibilityV0_1')
        const handled = await store['hasHandleCompatibilityV0_1']
        if (!handled) {
            // const oldConfigJson = await api.fs.readTextFile('chatbox/config.json', { dir: api.fs.Dir.LocalData })
            
            // const oldConfigJson = await readTextFile(Dir.LocalData + "/chatbox/config.json");
            const oldConfigJson = await Filesystem.readFile({
                path: 'config.json',
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
              });
            // console.log("config path", Dir.LocalData + "/chatbox/config.json");
            const oldConfig = JSON.parse(oldConfigJson.data)
            for (const key in oldConfig) {
                // await store.set(key, oldConfig[key])
                store[key] = oldConfig[key];
            }
            // await store.set("hasHandleCompatibilityV0_1", true)
            store["hasHandleCompatibilityV0_1"] = true;
            // await store.save()
            await Filesystem.writeFile({
                path: 'config.json',
                data: JSON.stringify(store),
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
            });
            console.log("old config write ok");
        }
    } catch (e) {
        console.log(e)
    }
}

export const shouldUseDarkColors = async (): Promise<boolean> => {
    // const theme = await api.window.appWindow.theme()
    // return theme === 'dark'
    return false
}

export async function onSystemThemeChange(callback: () => void) {
    // return api.window.appWindow.onThemeChanged(callback)
}

export const getVersion = async () => {
    // return api.app.getVersion()
    return "0.5.6"
}

export const openLink = async (url: string) => {
    // return api.shell.open(url)
}

export const getPlatform = async () => {
    // return api.os.platform()
    const userAgent = window.navigator.userAgent;
    let platform = "Unknown OS";
    if (userAgent.indexOf("Win") != -1) platform = "Windows";
    if (userAgent.indexOf("Mac") != -1) platform = "Macintosh";
    if (userAgent.indexOf("Linux") != -1) platform = "Linux";
    if (userAgent.indexOf("Android") != -1) platform = "Android";
    if (userAgent.indexOf("like Mac") != -1) platform = "iOS";
    console.log("platform", platform);
    return platform;
}