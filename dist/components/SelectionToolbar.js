import * as React from "react";
import { Portal } from "react-portal";
import some from "lodash/some";
import { TextSelection } from "prosemirror-state";
import getTableColMenuItems from "../menus/tableCol";
import getTableRowMenuItems from "../menus/tableRow";
import getTableMenuItems from "../menus/table";
import getFormattingMenuItems from "../menus/formatting";
import getImageMenuItems from "../menus/image";
import getDividerMenuItems from "../menus/divider";
import FloatingToolbar from "./FloatingToolbar";
import LinkEditor from "./LinkEditor";
import ToolbarMenu from "./ToolbarMenu";
import filterExcessSeparators from "../lib/filterExcessSeparators";
import isMarkActive from "../queries/isMarkActive";
import getMarkRange from "../queries/getMarkRange";
import isNodeActive from "../queries/isNodeActive";
import getColumnIndex from "../queries/getColumnIndex";
import getRowIndex from "../queries/getRowIndex";
import createAndInsertLink from "../commands/createAndInsertLink";
function isVisible(props) {
    const { view } = props;
    const { selection } = view.state;
    if (!selection)
        return false;
    if (selection.empty)
        return false;
    if (selection.node && selection.node.type.name === "hr") {
        return true;
    }
    if (selection.node && selection.node.type.name === "image") {
        return true;
    }
    if (selection.node)
        return false;
    const slice = selection.content();
    const fragment = slice.content;
    const nodes = fragment.content;
    return some(nodes, n => n.content.size);
}
export default class SelectionToolbar extends React.Component {
    constructor() {
        super(...arguments);
        this.isActive = false;
        this.menuRef = React.createRef();
        this.handleClickOutside = (ev) => {
            if (ev.target instanceof Node &&
                this.menuRef.current &&
                this.menuRef.current.contains(ev.target)) {
                return;
            }
            if (!this.isActive) {
                return;
            }
            const { view } = this.props;
            if (view.hasFocus()) {
                return;
            }
            const { dispatch } = view;
            dispatch(view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(0))));
        };
        this.handleOnCreateLink = async (title) => {
            const { dictionary, onCreateLink, view, onShowToast } = this.props;
            if (!onCreateLink) {
                return;
            }
            const { dispatch, state } = view;
            const { from, to } = state.selection;
            if (from === to) {
                return;
            }
            const href = `creating#${title}…`;
            const markType = state.schema.marks.link;
            dispatch(view.state.tr
                .removeMark(from, to, markType)
                .addMark(from, to, markType.create({ href })));
            createAndInsertLink(view, title, href, {
                onCreateLink,
                onShowToast,
                dictionary,
            });
        };
        this.handleOnSelectLink = ({ href, from, to, }) => {
            const { view } = this.props;
            const { state, dispatch } = view;
            const markType = state.schema.marks.link;
            dispatch(state.tr
                .removeMark(from, to, markType)
                .addMark(from, to, markType.create({ href })));
        };
    }
    componentDidUpdate() {
        const visible = isVisible(this.props);
        if (this.isActive && !visible) {
            this.isActive = false;
            this.props.onClose();
        }
        if (!this.isActive && visible) {
            this.isActive = true;
            this.props.onOpen();
        }
    }
    componentDidMount() {
        window.addEventListener("mouseup", this.handleClickOutside);
    }
    componentWillUnmount() {
        window.removeEventListener("mouseup", this.handleClickOutside);
    }
    render() {
        const { dictionary, onCreateLink, isTemplate, rtl, ...rest } = this.props;
        const { view } = rest;
        const { state } = view;
        const { selection } = state;
        const isCodeSelection = isNodeActive(state.schema.nodes.code_block)(state);
        const isDividerSelection = isNodeActive(state.schema.nodes.hr)(state);
        if (isCodeSelection) {
            return null;
        }
        const colIndex = getColumnIndex(state.selection);
        const rowIndex = getRowIndex(state.selection);
        const isTableSelection = colIndex !== undefined && rowIndex !== undefined;
        const link = isMarkActive(state.schema.marks.link)(state);
        const range = getMarkRange(selection.$from, state.schema.marks.link);
        const isImageSelection = selection.node && selection.node.type.name === "image";
        let isTextSelection = false;
        let items = [];
        if (isTableSelection) {
            items = getTableMenuItems(dictionary);
        }
        else if (colIndex !== undefined) {
            items = getTableColMenuItems(state, colIndex, rtl, dictionary);
        }
        else if (rowIndex !== undefined) {
            items = getTableRowMenuItems(state, rowIndex, dictionary);
        }
        else if (isImageSelection) {
            items = getImageMenuItems(state, dictionary);
        }
        else if (isDividerSelection) {
            items = getDividerMenuItems(state, dictionary);
        }
        else {
            items = getFormattingMenuItems(state, isTemplate, dictionary);
            isTextSelection = true;
        }
        items = items.filter(item => {
            if (item.name === "separator")
                return true;
            if (item.name && !this.props.commands[item.name])
                return false;
            return true;
        });
        items = filterExcessSeparators(items);
        if (!items.length) {
            return null;
        }
        const selectionText = state.doc.cut(state.selection.from, state.selection.to).textContent;
        if (isTextSelection && !selectionText) {
            return null;
        }
        return (React.createElement(Portal, null,
            React.createElement(FloatingToolbar, { view: view, active: isVisible(this.props), ref: this.menuRef }, link && range ? (React.createElement(LinkEditor, Object.assign({ dictionary: dictionary, mark: range.mark, from: range.from, to: range.to, onCreateLink: onCreateLink ? this.handleOnCreateLink : undefined, onSelectLink: this.handleOnSelectLink }, rest))) : (React.createElement(ToolbarMenu, Object.assign({ items: items }, rest))))));
    }
}
//# sourceMappingURL=SelectionToolbar.js.map