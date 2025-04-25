import { PageBreakIcon, HorizontalRuleIcon } from "outline-icons";
import isNodeActive from "../queries/isNodeActive";
export default function dividerMenuItems(state, dictionary) {
    const { schema } = state;
    return [
        {
            name: "hr",
            tooltip: dictionary.pageBreak,
            attrs: { markup: "***" },
            active: isNodeActive(schema.nodes.hr, { markup: "***" }),
            icon: PageBreakIcon,
        },
        {
            name: "hr",
            tooltip: dictionary.hr,
            attrs: { markup: "---" },
            active: isNodeActive(schema.nodes.hr, { markup: "---" }),
            icon: HorizontalRuleIcon,
        },
    ];
}
//# sourceMappingURL=divider.js.map