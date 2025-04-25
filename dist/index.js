import * as React from "react";
import memoize from "lodash/memoize";
import { EditorState, Selection } from "prosemirror-state";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { selectColumn, selectRow, selectTable } from "prosemirror-utils";
import { ThemeProvider } from "styled-components";
import { light as lightTheme, dark as darkTheme } from "./styles/theme";
import baseDictionary from "./dictionary";
import Flex from "./components/Flex";
import SelectionToolbar from "./components/SelectionToolbar";
import BlockMenu from "./components/BlockMenu";
import EmojiMenu from "./components/EmojiMenu";
import LinkToolbar from "./components/LinkToolbar";
import Tooltip from "./components/Tooltip";
import ExtensionManager from "./lib/ExtensionManager";
import ComponentView from "./lib/ComponentView";
import headingToSlug from "./lib/headingToSlug";
import { StyledEditor } from "./styles/editor";
import ReactNode from "./nodes/ReactNode";
import Doc from "./nodes/Doc";
import Text from "./nodes/Text";
import Blockquote from "./nodes/Blockquote";
import BulletList from "./nodes/BulletList";
import CodeBlock from "./nodes/CodeBlock";
import CodeFence from "./nodes/CodeFence";
import CheckboxList from "./nodes/CheckboxList";
import Emoji from "./nodes/Emoji";
import CheckboxItem from "./nodes/CheckboxItem";
import Embed from "./nodes/Embed";
import HardBreak from "./nodes/HardBreak";
import Heading from "./nodes/Heading";
import HorizontalRule from "./nodes/HorizontalRule";
import Image from "./nodes/Image";
import ListItem from "./nodes/ListItem";
import Notice from "./nodes/Notice";
import OrderedList from "./nodes/OrderedList";
import Paragraph from "./nodes/Paragraph";
import Table from "./nodes/Table";
import TableCell from "./nodes/TableCell";
import TableHeadCell from "./nodes/TableHeadCell";
import TableRow from "./nodes/TableRow";
import Bold from "./marks/Bold";
import Code from "./marks/Code";
import Highlight from "./marks/Highlight";
import Italic from "./marks/Italic";
import Link from "./marks/Link";
import Strikethrough from "./marks/Strikethrough";
import TemplatePlaceholder from "./marks/Placeholder";
import Underline from "./marks/Underline";
import BlockMenuTrigger from "./plugins/BlockMenuTrigger";
import EmojiTrigger from "./plugins/EmojiTrigger";
import Folding from "./plugins/Folding";
import History from "./plugins/History";
import Keys from "./plugins/Keys";
import MaxLength from "./plugins/MaxLength";
import Placeholder from "./plugins/Placeholder";
import SmartText from "./plugins/SmartText";
import TrailingNode from "./plugins/TrailingNode";
import PasteHandler from "./plugins/PasteHandler";
import ReactElement from "./nodes/ReactElement";
import ElementView from "./lib/ElementView";
export { schema, parser, serializer, renderToHtml } from "./server";
export { default as Extension } from "./lib/Extension";
export { ReactElement };
export const theme = lightTheme;
class RichMarkdownEditor extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isRTL: false,
            isEditorFocused: false,
            selectionMenuOpen: false,
            blockMenuOpen: false,
            linkMenuOpen: false,
            blockMenuSearch: "",
            emojiMenuOpen: false,
        };
        this.unmounted = false;
        this.nodeViewsMap = new Set();
        this.calculateDir = () => {
            if (!this.element)
                return;
            const isRTL = this.props.dir === "rtl" ||
                getComputedStyle(this.element).direction === "rtl";
            if (this.state.isRTL !== isRTL) {
                this.setState({ isRTL });
            }
        };
        this.value = () => {
            return this.serializer.serialize(this.view.state.doc);
        };
        this.handleChange = () => {
            if (!this.props.onChange)
                return;
            this.props.onChange(() => {
                return this.value();
            });
        };
        this.handleSave = () => {
            const { onSave } = this.props;
            if (onSave) {
                onSave({ done: false });
            }
        };
        this.handleSaveAndExit = () => {
            const { onSave } = this.props;
            if (onSave) {
                onSave({ done: true });
            }
        };
        this.handleEditorBlur = () => {
            this.setState({ isEditorFocused: false });
        };
        this.handleEditorFocus = () => {
            this.setState({ isEditorFocused: true });
        };
        this.handleOpenSelectionMenu = () => {
            this.setState({ blockMenuOpen: false, selectionMenuOpen: true });
        };
        this.handleCloseSelectionMenu = () => {
            this.setState({ selectionMenuOpen: false });
        };
        this.handleOpenLinkMenu = () => {
            this.setState({ blockMenuOpen: false, linkMenuOpen: true });
        };
        this.handleCloseLinkMenu = () => {
            this.setState({ linkMenuOpen: false });
        };
        this.handleOpenBlockMenu = (search) => {
            this.setState({ blockMenuOpen: true, blockMenuSearch: search });
        };
        this.handleCloseBlockMenu = () => {
            if (!this.state.blockMenuOpen)
                return;
            this.setState({ blockMenuOpen: false });
        };
        this.handleSelectRow = (index, state) => {
            this.view.dispatch(selectRow(index)(state.tr));
        };
        this.handleSelectColumn = (index, state) => {
            this.view.dispatch(selectColumn(index)(state.tr));
        };
        this.handleSelectTable = (state) => {
            this.view.dispatch(selectTable(state.tr));
        };
        this.focusAtStart = () => {
            const selection = Selection.atStart(this.view.state.doc);
            const transaction = this.view.state.tr.setSelection(selection);
            this.view.dispatch(transaction);
            this.view.focus();
        };
        this.focusAtEnd = () => {
            const selection = Selection.atEnd(this.view.state.doc);
            const transaction = this.view.state.tr.setSelection(selection);
            this.view.dispatch(transaction);
            this.view.focus();
        };
        this.getHeadings = () => {
            const headings = [];
            const previouslySeen = {};
            this.view.state.doc.forEach((node) => {
                if (node.type.name === "heading") {
                    const slug = headingToSlug(node);
                    let id = slug;
                    if (previouslySeen[slug] > 0) {
                        id = headingToSlug(node, previouslySeen[slug]);
                    }
                    previouslySeen[slug] =
                        previouslySeen[slug] !== undefined ? previouslySeen[slug] + 1 : 1;
                    headings.push({
                        title: node.textContent,
                        level: node.attrs.level,
                        id,
                    });
                }
            });
            return headings;
        };
        this.theme = () => {
            return this.props.theme || (this.props.dark ? darkTheme : lightTheme);
        };
        this.dictionary = memoize((providedDictionary) => {
            return { ...baseDictionary, ...providedDictionary };
        });
        this.view = null;
        this.nodeViews = null;
        this.nodes = null;
        this.marks = null;
        this.serializer = null;
        this.parser = null;
        this.extensions = null;
    }
    UNSAFE_componentWillMount() {
        this.unmounted = false;
    }
    componentDidMount() {
        this.init();
        if (this.props.scrollTo) {
            this.scrollToAnchor(this.props.scrollTo);
        }
        this.calculateDir();
        if (this.props.readOnly)
            return;
        if (this.props.autoFocus) {
            this.focusAtEnd();
        }
    }
    UNSAFE_componentWillUpdate(nextProps) {
        if (this.unmounted) {
            return;
        }
        const prevProps = this.props;
        if (nextProps.value && prevProps.value !== nextProps.value) {
            const newState = this.createState(nextProps.value);
            this.view.updateState(newState);
        }
        if (prevProps.readOnly !== nextProps.readOnly) {
            this.view.update({
                ...this.view.props,
                editable: () => !nextProps.readOnly,
            });
        }
        if (nextProps.scrollTo && nextProps.scrollTo !== prevProps.scrollTo) {
            this.scrollToAnchor(nextProps.scrollTo);
        }
        if (prevProps.readOnly && !nextProps.readOnly && nextProps.autoFocus) {
            this.focusAtEnd();
        }
        if (prevProps.dir !== nextProps.dir) {
            this.calculateDir();
        }
        if (!this.isBlurred &&
            !this.state.isEditorFocused &&
            !this.state.blockMenuOpen &&
            !this.state.linkMenuOpen &&
            !this.state.selectionMenuOpen) {
            this.isBlurred = true;
            if (nextProps.onBlur) {
                nextProps.onBlur();
            }
        }
        if (this.isBlurred &&
            (this.state.isEditorFocused ||
                this.state.blockMenuOpen ||
                this.state.linkMenuOpen ||
                this.state.selectionMenuOpen)) {
            this.isBlurred = false;
            if (nextProps.onFocus) {
                nextProps.onFocus();
            }
        }
        this.unmounted = false;
    }
    componentWillUnmount() {
        var _a;
        this.unmounted = true;
        const newState = this.createState("");
        (_a = this.view) === null || _a === void 0 ? void 0 : _a.updateState(newState);
    }
    init() {
        this.extensions = this.createExtensions();
        this.nodes = this.createNodes();
        this.marks = this.createMarks();
        this.schema = this.createSchema();
        this.plugins = this.createPlugins();
        this.rulePlugins = this.createRulePlugins();
        this.keymaps = this.createKeymaps();
        this.serializer = this.createSerializer();
        this.parser = this.createParser();
        this.pasteParser = this.createPasteParser();
        this.inputRules = this.createInputRules();
        this.nodeViews = this.createNodeViews();
        this.view = this.createView();
        this.commands = this.createCommands();
    }
    createExtensions() {
        const dictionary = this.dictionary(this.props.dictionary);
        return new ExtensionManager([
            ...[
                new Doc(),
                new HardBreak(),
                new Paragraph(),
                new Blockquote(),
                new CodeBlock({
                    dictionary,
                    onShowToast: this.props.onShowToast,
                }),
                new CodeFence({
                    dictionary,
                    onShowToast: this.props.onShowToast,
                }),
                new Emoji(),
                new Text(),
                new CheckboxList(),
                new CheckboxItem(),
                new BulletList(),
                new Embed({ embeds: this.props.embeds }),
                new ListItem(),
                new Notice({
                    dictionary,
                }),
                new Heading({
                    dictionary,
                    onShowToast: this.props.onShowToast,
                    offset: this.props.headingsOffset,
                }),
                new HorizontalRule(),
                new Image({
                    dictionary,
                    uploadImage: this.props.uploadImage,
                    onImageUploadStart: this.props.onImageUploadStart,
                    onImageUploadStop: this.props.onImageUploadStop,
                    onShowToast: this.props.onShowToast,
                }),
                new Table(),
                new TableCell({
                    onSelectTable: this.handleSelectTable,
                    onSelectRow: this.handleSelectRow,
                }),
                new TableHeadCell({
                    onSelectColumn: this.handleSelectColumn,
                }),
                new TableRow(),
                new Bold(),
                new Code(),
                new Highlight(),
                new Italic(),
                new TemplatePlaceholder(),
                new Underline(),
                new Link({
                    onKeyboardShortcut: this.handleOpenLinkMenu,
                    onClickLink: this.props.onClickLink,
                    onClickHashtag: this.props.onClickHashtag,
                    onHoverLink: this.props.onHoverLink,
                }),
                new Strikethrough(),
                new OrderedList(),
                new History(),
                new Folding(),
                new SmartText(),
                new TrailingNode(),
                new PasteHandler(),
                new Keys({
                    onBlur: this.handleEditorBlur,
                    onFocus: this.handleEditorFocus,
                    onSave: this.handleSave,
                    onSaveAndExit: this.handleSaveAndExit,
                    onCancel: this.props.onCancel,
                }),
                new BlockMenuTrigger({
                    dictionary,
                    onOpen: this.handleOpenBlockMenu,
                    onClose: this.handleCloseBlockMenu,
                }),
                new EmojiTrigger({
                    onOpen: (search) => {
                        this.setState({ emojiMenuOpen: true, blockMenuSearch: search });
                    },
                    onClose: () => {
                        this.setState({ emojiMenuOpen: false });
                    },
                }),
                new Placeholder({
                    placeholder: this.props.placeholder,
                }),
                new MaxLength({
                    maxLength: this.props.maxLength,
                }),
            ].filter((extension) => {
                if (this.props.disableExtensions) {
                    return !this.props.disableExtensions.includes(extension.name);
                }
                return true;
            }),
            ...(this.props.extensions || []),
        ], this);
    }
    createPlugins() {
        return this.extensions.plugins;
    }
    createRulePlugins() {
        return this.extensions.rulePlugins;
    }
    createKeymaps() {
        return this.extensions.keymaps({
            schema: this.schema,
        });
    }
    createInputRules() {
        return this.extensions.inputRules({
            schema: this.schema,
        });
    }
    createNodeViews() {
        return this.extensions.extensions
            .filter((extension) => extension instanceof ReactElement || extension instanceof ReactNode)
            .reduce((nodeViews, extension) => {
            const nodeView = (node, view, getPos, decorations) => {
                const options = {
                    editor: this,
                    extension,
                    node,
                    view,
                    getPos,
                    decorations,
                };
                if (extension instanceof ReactNode) {
                    return new ComponentView(extension.component, options);
                }
                else {
                    const ev = new ElementView(extension.element, options);
                    this.nodeViewsMap.add(ev);
                    return ev;
                }
            };
            return {
                ...nodeViews,
                [extension.name]: nodeView,
            };
        }, {});
    }
    scheduleNodeViewUpdate(ev) {
        if (!this.nodeViewsMap.has(ev)) {
            this.nodeViewsMap.add(ev);
        }
        this.forceUpdate();
    }
    removeNodeView(ev) {
        this.nodeViewsMap.delete(ev);
        this.forceUpdate();
    }
    createCommands() {
        return this.extensions.commands({
            schema: this.schema,
            view: this.view,
        });
    }
    createNodes() {
        return this.extensions.nodes;
    }
    createMarks() {
        return this.extensions.marks;
    }
    createSchema() {
        return new Schema({
            nodes: this.nodes,
            marks: this.marks,
        });
    }
    createSerializer() {
        return this.extensions.serializer();
    }
    createParser() {
        return this.extensions.parser({
            schema: this.schema,
            plugins: this.rulePlugins,
        });
    }
    createPasteParser() {
        return this.extensions.parser({
            schema: this.schema,
            rules: { linkify: true },
            plugins: this.rulePlugins,
        });
    }
    createState(value) {
        const doc = this.createDocument(value || this.props.defaultValue);
        return EditorState.create({
            schema: this.schema,
            doc,
            plugins: [
                ...this.plugins,
                ...this.keymaps,
                dropCursor({ color: this.theme().cursor }),
                gapCursor(),
                inputRules({
                    rules: this.inputRules,
                }),
                keymap(baseKeymap),
            ],
        });
    }
    createDocument(content) {
        return this.parser.parse(content);
    }
    createView() {
        if (!this.element) {
            throw new Error("createView called before ref available");
        }
        const isEditingCheckbox = (tr) => {
            return tr.steps.some((step) => {
                var _a, _b, _c;
                return ((_c = (_b = (_a = step.slice) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.firstChild) === null || _c === void 0 ? void 0 : _c.type.name) ===
                    this.schema.nodes.checkbox_item.name;
            });
        };
        const self = this;
        const view = new EditorView(this.element, {
            state: this.createState(this.props.value),
            editable: () => !this.props.readOnly,
            nodeViews: this.nodeViews,
            handleDOMEvents: this.props.handleDOMEvents,
            dispatchTransaction: function (transaction) {
                const { state, transactions } = this.state.applyTransaction(transaction);
                this.updateState(state);
                if (transactions.some((tr) => tr.docChanged) &&
                    (!self.props.readOnly ||
                        (self.props.readOnlyWriteCheckboxes &&
                            transactions.some(isEditingCheckbox)))) {
                    self.handleChange();
                }
                self.calculateDir();
                self.forceUpdate();
            },
        });
        view.dom.setAttribute("role", "textbox");
        return view;
    }
    scrollToAnchor(hash) {
        if (!hash)
            return;
        try {
            const element = document.querySelector(hash);
            if (element)
                element.scrollIntoView({ behavior: "smooth" });
        }
        catch (err) {
            console.warn(`Attempted to scroll to invalid hash: ${hash}`, err);
        }
    }
    get menuOpen() {
        return Object.keys(this.state).find(key => key.endsWith("MenuOpen") && this.state[key]);
    }
    renderNodeViewPortals() {
        const portals = [];
        this.nodeViewsMap.forEach((ev) => {
            const portal = ev.render();
            if (portal) {
                portals.push(portal);
            }
        });
        return portals;
    }
    render() {
        const { dir, readOnly, readOnlyWriteCheckboxes, style, tooltip, className, onKeyDown, } = this.props;
        const { isRTL } = this.state;
        const dictionary = this.dictionary(this.props.dictionary);
        if (this.unmounted) {
            return (React.createElement(Flex, { onKeyDown: onKeyDown, style: style, className: className, align: "flex-start", justify: "center", dir: dir, column: true },
                React.createElement("div", { ref: ref => (this.element = ref) })));
        }
        return (React.createElement(Flex, { onKeyDown: onKeyDown, style: style, className: className, align: "flex-start", justify: "center", dir: dir, column: true },
            React.createElement(ThemeProvider, { theme: this.theme() },
                React.createElement(React.Fragment, null,
                    React.createElement(StyledEditor, { dir: dir, rtl: isRTL, readOnly: readOnly, readOnlyWriteCheckboxes: readOnlyWriteCheckboxes, ref: (ref) => (this.element = ref) }),
                    !readOnly && this.view && (React.createElement(React.Fragment, null,
                        React.createElement(SelectionToolbar, { view: this.view, dictionary: dictionary, commands: this.commands, rtl: isRTL, isTemplate: this.props.template === true, onOpen: this.handleOpenSelectionMenu, onClose: this.handleCloseSelectionMenu, onSearchLink: this.props.onSearchLink, onClickLink: this.props.onClickLink, onCreateLink: this.props.onCreateLink, tooltip: tooltip }),
                        React.createElement(LinkToolbar, { view: this.view, dictionary: dictionary, isActive: this.state.linkMenuOpen, onCreateLink: this.props.onCreateLink, onSearchLink: this.props.onSearchLink, onClickLink: this.props.onClickLink, onShowToast: this.props.onShowToast, onClose: this.handleCloseLinkMenu, tooltip: tooltip }),
                        React.createElement(EmojiMenu, { view: this.view, commands: this.commands, dictionary: dictionary, rtl: isRTL, isActive: this.state.emojiMenuOpen, search: this.state.blockMenuSearch, onClose: () => this.setState({ emojiMenuOpen: false }) }),
                        React.createElement(BlockMenu, { view: this.view, commands: this.commands, dictionary: dictionary, rtl: isRTL, isActive: this.state.blockMenuOpen, search: this.state.blockMenuSearch, onClose: this.handleCloseBlockMenu, uploadImage: this.props.uploadImage, onLinkToolbarOpen: this.handleOpenLinkMenu, onImageUploadStart: this.props.onImageUploadStart, onImageUploadStop: this.props.onImageUploadStop, onShowToast: this.props.onShowToast, embeds: this.props.embeds }),
                        this.element &&
                            this.props.menus.map((Menu, index) => {
                                const menuName = Menu.name.charAt(0).toLowerCase() + Menu.name.slice(1);
                                return (React.createElement(Menu, { key: index, view: this.view, rtl: isRTL, isActive: this.state[menuName + "Open"], commands: this.commands, search: this.state[menuName + "Search"], onClose: () => this.setState({ [menuName + "Open"]: false }), onClearSearch: () => this.setState({ [menuName + "Search"]: "" }) }));
                            }))),
                    this.renderNodeViewPortals()))));
    }
}
RichMarkdownEditor.defaultProps = {
    defaultValue: "",
    dir: "auto",
    placeholder: "Write something nice…",
    onImageUploadStart: () => {
    },
    onImageUploadStop: () => {
    },
    onClickLink: (href) => {
        window.open(href, "_blank");
    },
    embeds: [],
    extensions: [],
    menus: [],
    tooltip: Tooltip,
};
export default RichMarkdownEditor;
//# sourceMappingURL=index.js.map