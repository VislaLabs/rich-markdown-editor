import { findBlockNodes } from "prosemirror-utils";
export default function findCollapsedNodes(doc) {
    const blocks = findBlockNodes(doc);
    const nodes = [];
    let withinCollapsedHeading;
    for (const block of blocks) {
        if (block.node.type.name === "heading") {
            if (!withinCollapsedHeading ||
                block.node.attrs.level <= withinCollapsedHeading) {
                if (block.node.attrs.collapsed) {
                    if (!withinCollapsedHeading) {
                        withinCollapsedHeading = block.node.attrs.level;
                    }
                }
                else {
                    withinCollapsedHeading = undefined;
                }
                continue;
            }
        }
        if (withinCollapsedHeading) {
            nodes.push(block);
        }
    }
    return nodes;
}
//# sourceMappingURL=findCollapsedNodes.js.map