import React from "react";
import { findParentNode } from "prosemirror-utils";
import CommandMenu from "./CommandMenu";
import BlockMenuItem from "./BlockMenuItem";
import getMenuItems from "../menus/block";
class BlockMenu extends React.Component {
    constructor() {
        super(...arguments);
        this.clearSearch = () => {
            const { state, dispatch } = this.props.view;
            const parent = findParentNode(node => !!node)(state.selection);
            if (parent) {
                dispatch(state.tr.insertText("", parent.pos, state.selection.to));
            }
        };
    }
    get items() {
        return getMenuItems(this.props.dictionary);
    }
    render() {
        return (React.createElement(CommandMenu, Object.assign({}, this.props, { filterable: true, onClearSearch: this.clearSearch, renderMenuItem: (item, _index, options) => {
                return (React.createElement(BlockMenuItem, { onClick: options.onClick, selected: options.selected, icon: item.icon, title: item.title, shortcut: item.shortcut }));
            }, items: this.items })));
    }
}
export default BlockMenu;
//# sourceMappingURL=BlockMenu.js.map