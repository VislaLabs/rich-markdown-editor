import markdownit from "markdown-it";
export default function rules({ rules = {}, plugins = [], }) {
    const markdownIt = markdownit("default", {
        breaks: false,
        html: false,
        linkify: false,
        ...rules,
    });
    plugins.forEach(plugin => markdownIt.use(plugin));
    return markdownIt;
}
//# sourceMappingURL=rules.js.map