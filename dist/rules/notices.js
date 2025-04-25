import customFence from "markdown-it-container";
export default function notice(md) {
    return customFence(md, "notice", {
        marker: ":",
        validate: () => true,
        render: function (tokens, idx) {
            const { info } = tokens[idx];
            if (tokens[idx].nesting === 1) {
                return `<div class="notice notice-${md.utils.escapeHtml(info)}">\n`;
            }
            else {
                return "</div>\n";
            }
        },
    });
}
//# sourceMappingURL=notices.js.map