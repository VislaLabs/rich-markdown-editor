import React from "react";
import gemojies from "gemoji";
import FuzzySearch from "fuzzy-search";
import CommandMenu from "./CommandMenu";
import EmojiMenuItem from "./EmojiMenuItem";
const searcher = new FuzzySearch(gemojies, ["names"], {
    caseSensitive: true,
    sort: true,
});
class EmojiMenu extends React.Component {
    constructor() {
        super(...arguments);
        this.clearSearch = () => {
            var _a;
            const { state, dispatch } = this.props.view;
            dispatch(state.tr.insertText("", state.selection.$from.pos - ((_a = this.props.search) !== null && _a !== void 0 ? _a : "").length - 1, state.selection.to));
        };
    }
    get items() {
        const { search = "" } = this.props;
        const n = search.toLowerCase();
        const result = searcher.search(n).map(item => {
            const description = item.description;
            const name = item.names[0];
            return {
                ...item,
                name: "emoji",
                title: name,
                description,
                attrs: { markup: name, "data-name": name },
            };
        });
        return result.slice(0, 10);
    }
    render() {
        return (React.createElement(CommandMenu, Object.assign({}, this.props, { id: "emoji-menu-container", filterable: false, onClearSearch: this.clearSearch, renderMenuItem: (item, _index, options) => {
                return (React.createElement(EmojiMenuItem, { onClick: options.onClick, selected: options.selected, title: item.description, emoji: item.emoji, containerId: "emoji-menu-container" }));
            }, items: this.items })));
    }
}
export default EmojiMenu;
//# sourceMappingURL=EmojiMenu.js.map