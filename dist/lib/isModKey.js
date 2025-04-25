const SSR = typeof window === "undefined";
const isMac = !SSR && window.navigator.platform === "MacIntel";
export default function isModKey(event) {
    return isMac ? event.metaKey : event.ctrlKey;
}
//# sourceMappingURL=isModKey.js.map