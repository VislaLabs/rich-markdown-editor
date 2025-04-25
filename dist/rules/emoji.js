import nameToEmoji from "gemoji/name-to-emoji.json";
import emojiPlugin from "markdown-it-emoji";
export default function emoji(md) {
    return emojiPlugin(md, {
        defs: nameToEmoji,
        shortcuts: {},
    });
}
//# sourceMappingURL=emoji.js.map