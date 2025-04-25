export default function isUrl(text) {
    if (text.match(/\n/)) {
        return false;
    }
    try {
        const url = new URL(text);
        return url.hostname !== "";
    }
    catch (err) {
        return false;
    }
}
//# sourceMappingURL=isUrl.js.map