import escape from "lodash/escape";
import slugify from "slugify";
function safeSlugify(text) {
    return `h-${escape(slugify(text, {
        remove: /[!"#$%&'\.()*+,\/:;<=>?@\[\]\\^_`{|}~]/g,
        lower: true,
    }))}`;
}
export default function headingToSlug(node, index = 0) {
    const slugified = safeSlugify(node.textContent);
    if (index === 0)
        return slugified;
    return `${slugified}-${index}`;
}
export function headingToPersistenceKey(node, id) {
    const slug = headingToSlug(node);
    return `rme-${id || (window === null || window === void 0 ? void 0 : window.location.pathname)}–${slug}`;
}
//# sourceMappingURL=headingToSlug.js.map