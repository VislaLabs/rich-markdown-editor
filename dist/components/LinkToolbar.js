import * as React from "react";
import LinkEditor from "./LinkEditor";
import FloatingToolbar from "./FloatingToolbar";
import createAndInsertLink from "../commands/createAndInsertLink";
function isActive(props) {
    const { view } = props;
    const { selection } = view.state;
    try {
        const paragraph = view.domAtPos(selection.from);
        return props.isActive && !!paragraph.node;
    }
    catch (err) {
        return false;
    }
}
export default class LinkToolbar extends React.Component {
    constructor() {
        super(...arguments);
        this.menuRef = React.createRef();
        this.state = {
            left: -1000,
            top: undefined,
        };
        this.handleClickOutside = ev => {
            if (ev.target &&
                this.menuRef.current &&
                this.menuRef.current.contains(ev.target)) {
                return;
            }
            this.props.onClose();
        };
        this.handleOnCreateLink = async (title) => {
            const { dictionary, onCreateLink, view, onClose, onShowToast } = this.props;
            onClose();
            this.props.view.focus();
            if (!onCreateLink) {
                return;
            }
            const { dispatch, state } = view;
            const { from, to } = state.selection;
            if (from !== to) {
                return;
            }
            const href = `creating#${title}…`;
            dispatch(view.state.tr
                .insertText(title, from, to)
                .addMark(from, to + title.length, state.schema.marks.link.create({ href })));
            createAndInsertLink(view, title, href, {
                onCreateLink,
                onShowToast,
                dictionary,
            });
        };
        this.handleOnSelectLink = ({ href, title, }) => {
            const { view, onClose } = this.props;
            onClose();
            this.props.view.focus();
            const { dispatch, state } = view;
            const { from, to } = state.selection;
            if (from !== to) {
                return;
            }
            dispatch(view.state.tr
                .insertText(title, from, to)
                .addMark(from, to + title.length, state.schema.marks.link.create({ href })));
        };
    }
    componentDidMount() {
        window.addEventListener("mousedown", this.handleClickOutside);
    }
    componentWillUnmount() {
        window.removeEventListener("mousedown", this.handleClickOutside);
    }
    render() {
        const { onCreateLink, onClose, ...rest } = this.props;
        const { selection } = this.props.view.state;
        const active = isActive(this.props);
        return (React.createElement(FloatingToolbar, Object.assign({ ref: this.menuRef, active: active }, rest), active && (React.createElement(LinkEditor, Object.assign({ from: selection.from, to: selection.to, onCreateLink: onCreateLink ? this.handleOnCreateLink : undefined, onSelectLink: this.handleOnSelectLink, onRemoveLink: onClose }, rest)))));
    }
}
//# sourceMappingURL=LinkToolbar.js.map