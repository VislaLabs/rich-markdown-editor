/* global window File Promise */
import * as React from 'react';
import memoize from 'lodash/memoize';
import {
  EditorState,
  NodeSelection,
  Selection,
  Plugin,
} from 'prosemirror-state';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown';
import { EditorView } from 'prosemirror-view';
import { Schema, NodeSpec, MarkSpec, Slice } from 'prosemirror-model';
import { inputRules, InputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { selectColumn, selectRow, selectTable } from 'prosemirror-utils';
import { ThemeProvider } from 'styled-components';
import { light as lightTheme, dark as darkTheme } from './styles/theme';
import baseDictionary from './dictionary';
import Flex from './components/Flex';
import { SearchResult } from './components/LinkEditor';
import { EmbedDescriptor, ToastType } from './types';
import SelectionToolbar from './components/SelectionToolbar';
import BlockMenu from './components/BlockMenu';
import EmojiMenu from './components/EmojiMenu';
import LinkToolbar from './components/LinkToolbar';
import Tooltip from './components/Tooltip';
import Extension from './lib/Extension';
import ExtensionManager from './lib/ExtensionManager';
import ComponentView from './lib/ComponentView';
import headingToSlug from './lib/headingToSlug';

// styles
import { StyledEditor } from './styles/editor';

// nodes
import ReactNode from './nodes/ReactNode';
import Doc from './nodes/Doc';
import Text from './nodes/Text';
import Blockquote from './nodes/Blockquote';
import BulletList from './nodes/BulletList';
import CodeBlock from './nodes/CodeBlock';
import CodeFence from './nodes/CodeFence';
import CheckboxList from './nodes/CheckboxList';
import Emoji from './nodes/Emoji';
import CheckboxItem from './nodes/CheckboxItem';
import HardBreak from './nodes/HardBreak';
import Heading from './nodes/Heading';
import HorizontalRule from './nodes/HorizontalRule';
import Image from './nodes/Image';
import ListItem from './nodes/ListItem';
import Notice from './nodes/Notice';
import OrderedList from './nodes/OrderedList';
import Paragraph from './nodes/Paragraph';
import Table from './nodes/Table';
import TableCell from './nodes/TableCell';
import TableHeadCell from './nodes/TableHeadCell';
import TableRow from './nodes/TableRow';
import Media from './nodes/Media';

// marks
import Bold from './marks/Bold';
import Code from './marks/Code';
import Highlight from './marks/Highlight';
import Italic from './marks/Italic';
import Link from './marks/Link';
import Strikethrough from './marks/Strikethrough';
import TemplatePlaceholder from './marks/Placeholder';
import Underline from './marks/Underline';

// plugins
import BlockMenuTrigger from './plugins/BlockMenuTrigger';
import EmojiTrigger from './plugins/EmojiTrigger';
import Folding from './plugins/Folding';
import History from './plugins/History';
import Keys from './plugins/Keys';
import MaxLength from './plugins/MaxLength';
import Placeholder from './plugins/Placeholder';
import SmartText from './plugins/SmartText';
import TrailingNode from './plugins/TrailingNode';
import PasteHandler from './plugins/PasteHandler';
import { PluginSimple } from 'markdown-it';

export { schema, parser, serializer, renderToHtml } from './server';

export { default as Extension } from './lib/Extension';

export const theme = lightTheme;

export type Props = {
  id?: string;
  value?: string;
  query?: any;
  defaultValue: string;
  placeholder: string;
  extensions?: Extension[];
  disableExtensions?: (
    | 'strong'
    | 'code_inline'
    | 'highlight'
    | 'em'
    | 'link'
    | 'placeholder'
    | 'strikethrough'
    | 'underline'
    | 'blockquote'
    | 'bullet_list'
    | 'checkbox_item'
    | 'checkbox_list'
    | 'code_block'
    | 'code_fence'
    | 'embed'
    | 'br'
    | 'heading'
    | 'hr'
    | 'image'
    | 'list_item'
    | 'container_notice'
    | 'ordered_list'
    | 'paragraph'
    | 'table'
    | 'td'
    | 'th'
    | 'tr'
    | 'emoji'
  )[];
  autoFocus?: boolean;
  readOnly?: boolean;
  readOnlyWriteCheckboxes?: boolean;
  dictionary?: Partial<typeof baseDictionary>;
  dark?: boolean;
  dir?: string;
  theme?: typeof theme;
  template?: boolean;
  headingsOffset?: number;
  maxLength?: number;
  scrollTo?: string;
  handleDOMEvents?: {
    [name: string]: (view: EditorView, event: Event) => boolean;
  };
  uploadImage?: (file: File) => Promise<string>;
  onBlur?: () => void;
  onFocus?: () => void;
  onSave?: ({ done }) => void;
  onCancel?: () => void;
  onChange?: (value: () => string) => void;
  onImageUploadStart?: () => void;
  onImageUploadStop?: () => void;
  onCreateLink?: (title: string) => Promise<string>;
  onSearchLink?: (term: string) => Promise<SearchResult[]>;
  onClickLink: (href: string, event: MouseEvent) => void;
  onHoverLink?: (event: MouseEvent) => boolean;
  onClickHashtag?: (tag: string, event: MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  embeds: EmbedDescriptor[];
  onShowToast?: (message: string, code: ToastType) => void;
  tooltip: typeof React.Component | React.FC<any>;
  className?: string;
  style?: React.CSSProperties;
};

type State = {
  isRTL: boolean;
  isEditorFocused: boolean;
  selectionMenuOpen: boolean;
  blockMenuOpen: boolean;
  linkMenuOpen: boolean;
  blockMenuSearch: string;
  emojiMenuOpen: boolean;
};

type Step = {
  slice?: Slice;
};

class RichMarkdownEditor extends React.PureComponent<Props, State> {
  static defaultProps = {
    defaultValue: '',
    dir: 'auto',
    placeholder: 'Write something nice…',
    onImageUploadStart: () => {
      // no default behavior
    },
    onImageUploadStop: () => {
      // no default behavior
    },
    onClickLink: href => {
      window.open(href, '_blank');
    },
    embeds: [],
    extensions: [],
    tooltip: Tooltip,
  };

  state = {
    isRTL: false,
    isEditorFocused: false,
    selectionMenuOpen: false,
    blockMenuOpen: false,
    linkMenuOpen: false,
    blockMenuSearch: '',
    emojiMenuOpen: false,
  };

  isBlurred: boolean;
  extensions: ExtensionManager;
  element?: HTMLElement | null;
  view: EditorView;
  schema: Schema;
  serializer: MarkdownSerializer;
  parser: MarkdownParser;
  pasteParser: MarkdownParser;
  plugins: Plugin[];
  keymaps: Plugin[];
  inputRules: InputRule[];
  nodeViews: {
    [name: string]: (node, view, getPos, decorations) => ComponentView;
  };
  nodes: { [name: string]: NodeSpec };
  marks: { [name: string]: MarkSpec };
  commands: Record<string, any>;
  rulePlugins: PluginSimple[];
  unmounted? = false;

  constructor(props) {
    super(props);
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

    if (this.props.readOnly) return;

    if (this.props.autoFocus) {
      this.focusAtEnd();
    }
  }

  UNSAFE_componentWillUpdate(nextProps: Readonly<Props>) {
    if (this.unmounted) {
      return;
    }
    const prevProps = this.props;
    // Allow changes to the 'value' prop to update the editor from outside
    if (nextProps.value !== undefined && prevProps.value !== nextProps.value) {
      const newState = this.createState(nextProps.value);
      this.view.updateState(newState);
    }

    const Embed = this.extensions.extensions.find(n => n.name === 'embed')
      ?.constructor as any as { getHref };

    if (nextProps.query !== prevProps.query) {
      // const newState = EditorState.fromJSON(
      //   this.view.state.config,
      //   this.view.state.toJSON(),
      // );
      // newState.doc.content.content[1].content.content[0].attrs.updatedHref =
      //   newState.doc.content.content[1].content.content[0].attrs.href.replace(
      //     'f2b18d3e1c793a67894137141691ff7a943c5e1e27d8df3f845102e2a43c3e4f/dcb24a1d01f09f5aa32fd1f7aa2021aa131db3ded8fe27dee21f53a3a211c76b',
      //     '3bb086d60a95edb4bbff62ee03283a7a0db6d6dd259f9123d7aa8ba764c4121e',
      //   );
      // this.view.updateState(newState);
      // const prevSelected = prevProps.query.selected;
      // const selected = nextProps.query.selected;
      // if (prevSelected.anchor !== selected.anchor) {
      //   this.view.state.doc.descendants((node, pos) => {
      //     if (node.type === this.schema.nodes.embed) {
      //       const query = getQuery(node.attrs.href, nextProps.query);
      //       if (query.module.id === selected.anchor) {
      //         const element = node.ref.current;
      //         if (element) {
      //           element.scrollIntoView({ behavior: 'smooth' });
      //         }
      //       }
      //     }
      //   });
      // }
      this.view.state.doc.descendants((node, pos) => {
        if (node.type === this.schema.nodes.embed) {
          // const moduleQuery = getQuery(node.attrs.href, nextProps.query);
          // const depth = [nextProps.query.depth, moduleQuery.module.id].join(
          //   '.',
          // );
          // const { href: nextHref, query: nextModuleQuery } = getHref(
          //   node.attrs.href,
          //   nextProps.query,
          //   true,
          // );
          // // const nextHref = nextProps.query._selected[depth]?.expand.url.href;
          // if (nextHref && nextHref !== node.attrs.href) {
          //   const $pos = this.view.state.doc.resolve(pos);
          //   const attrs = {
          //     ...node.attrs,
          //     href: nextHref,
          //     // ...(!nextProps.readOnly
          //     //   ? { href: nextHref }
          //     //   : { updatedHref: nextHref }),
          //   };
          const newAttrs = {
            ...node.attrs,
            parentQuery: nextProps.query,
            href: Embed.getHref(node.attrs, nextProps.query).href,
          };
          this.view.dispatch(
            this.view.state.tr.setNodeMarkup(pos, undefined, newAttrs),
          );
          // const { selection } = state;
          // dispatch(state.tr.setNodeMarkup(selection.from, undefined, attrs));
          // }
        }
      });
      // for (const key of Object.keys(nextProps.query._selected)) {
      //   if (
      //     prevProps.query._selected[key]?.url.to !==
      //     nextProps.query._selected[key].url.to
      //   ) {
      //     let stop = false;
      //     this.view.state.doc.descendants((node, pos) => {
      //       if (node.type === this.schema.nodes.embed) {
      //         const query = getQuery(node.attrs.href, nextProps.query);
      //         const queries = query.modules?.length
      //           ? [query, ...Array.from(query)]
      //           : [query];
      //         for (const viewQuery of queries) {
      //           if (
      //             viewQuery.selectedId &&
      //             viewQuery.selectedId.endsWith(
      //               nextProps.query._selected[key].selectedId,
      //             )
      //           ) {
      //             const element = node.ref.current;
      //             if (element) {
      //               element.scrollIntoViewIfNeeded({ behavior: 'smooth' });
      //               const $pos = this.view.state.doc.resolve(pos);
      //               const transaction = this.view.state.tr.setSelection(
      //                 new NodeSelection($pos),
      //               );
      //               this.view.dispatch(transaction);
      //               stop = true;
      //               break;
      //             }
      //           }
      //         }
      //       }
      //       if (stop) {
      //         return false;
      //       }
      //     });
      //   }
      // }
    }

    // pass readOnly changes through to underlying editor instance
    if (prevProps.readOnly !== nextProps.readOnly) {
      this.view.update({
        ...this.view.props,
        editable: () => !nextProps.readOnly,
      });
    }

    if (nextProps.scrollTo && nextProps.scrollTo !== prevProps.scrollTo) {
      this.scrollToAnchor(nextProps.scrollTo);
    }

    // Focus at the end of the document if switching from readOnly and autoFocus
    // is set to true
    if (prevProps.readOnly && !nextProps.readOnly && nextProps.autoFocus) {
      this.focusAtEnd();
    }

    if (prevProps.dir !== nextProps.dir) {
      this.calculateDir();
    }

    if (
      !this.isBlurred &&
      !this.state.isEditorFocused &&
      !this.state.blockMenuOpen &&
      !this.state.linkMenuOpen &&
      !this.state.selectionMenuOpen
    ) {
      this.isBlurred = true;
      if (nextProps.onBlur) {
        nextProps.onBlur();
      }
    }

    if (
      this.isBlurred &&
      (this.state.isEditorFocused ||
        this.state.blockMenuOpen ||
        this.state.linkMenuOpen ||
        this.state.selectionMenuOpen)
    ) {
      this.isBlurred = false;
      if (nextProps.onFocus) {
        nextProps.onFocus();
      }
    }

    this.unmounted = false;
  }

  componentWillUnmount() {
    this.unmounted = true;
    const newState = this.createState('');
    this.view.updateState(newState);
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

    // adding nodes here? Update schema.ts for serialization on the server
    return new ExtensionManager(
      [
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
          // new Embed({ embeds: this.props.embeds }),
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
          new Media({
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
            onOpen: (search: string) => {
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
        ].filter(extension => {
          // Optionaly disable extensions
          if (this.props.disableExtensions) {
            return !(this.props.disableExtensions as string[]).includes(
              extension.name,
            );
          }
          return true;
        }),
        ...(this.props.extensions || []),
      ],
      this,
    );
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
      .filter((extension: ReactNode) => extension.component)
      .reduce((nodeViews, extension: ReactNode) => {
        const nodeView = (node, view, getPos, decorations) => {
          // @ts-ignore
          return new ComponentView(extension.component, {
            editor: this,
            extension,
            node,
            view,
            getPos,
            decorations,
          } as any);
        };

        return {
          ...nodeViews,
          [extension.name]: nodeView,
        };
      }, {});
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

  createState(value?: string) {
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

  createDocument(content: string) {
    return this.parser.parse(content);
  }

  createView() {
    if (!this.element) {
      throw new Error('createView called before ref available');
    }

    const isEditingCheckbox = tr => {
      return tr.steps.some(
        (step: Step) =>
          step.slice?.content?.firstChild?.type.name ===
          this.schema.nodes.checkbox_item.name,
      );
    };

    const self = this; // eslint-disable-line
    const view = new EditorView(this.element, {
      state: this.createState(this.props.value),
      editable: () => !this.props.readOnly,
      nodeViews: this.nodeViews,
      handleDOMEvents: this.props.handleDOMEvents,
      query: this.props.query,
      dispatchTransaction: function (transaction) {
        // callback is bound to have the view instance as its this binding
        const { state, transactions } =
          this.state.applyTransaction(transaction);

        this.updateState(state);

        // If any of the transactions being dispatched resulted in the doc
        // changing then call our own change handler to let the outside world
        // know
        if (
          transactions.some(tr => tr.docChanged) &&
          (!self.props.readOnly ||
            (self.props.readOnlyWriteCheckboxes &&
              transactions.some(isEditingCheckbox)))
        ) {
          self.handleChange();
        }

        self.calculateDir();

        // Because Prosemirror and React are not linked we must tell React that
        // a render is needed whenever the Prosemirror state changes.
        self.forceUpdate();
      },
    });

    // Tell third-party libraries and screen-readers that this is an input
    view.dom.setAttribute('role', 'textbox');

    return view;
  }

  scrollToAnchor(hash: string) {
    if (!hash) return;

    try {
      const element = document.querySelector(hash);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      // querySelector will throw an error if the hash begins with a number
      // or contains a period. This is protected against now by safeSlugify
      // however previous links may be in the wild.
      console.warn(`Attempted to scroll to invalid hash: ${hash}`, err);
    }
  }

  calculateDir = () => {
    if (!this.element) return;

    const isRTL =
      this.props.dir === 'rtl' ||
      getComputedStyle(this.element).direction === 'rtl';

    if (this.state.isRTL !== isRTL) {
      this.setState({ isRTL });
    }
  };

  value = (): string => {
    return this.serializer.serialize(this.view.state.doc);
  };

  handleChange = () => {
    if (!this.props.onChange) return;

    this.props.onChange(() => {
      return this.value();
    });
  };

  handleSave = () => {
    const { onSave } = this.props;
    if (onSave) {
      onSave({ done: false });
    }
  };

  handleSaveAndExit = () => {
    const { onSave } = this.props;
    if (onSave) {
      onSave({ done: true });
    }
  };

  handleEditorBlur = () => {
    this.setState({ isEditorFocused: false });
  };

  handleEditorFocus = () => {
    this.setState({ isEditorFocused: true });
  };

  handleOpenSelectionMenu = () => {
    this.setState({ blockMenuOpen: false, selectionMenuOpen: true });
  };

  handleCloseSelectionMenu = () => {
    this.setState({ selectionMenuOpen: false });
  };

  handleOpenLinkMenu = () => {
    this.setState({ blockMenuOpen: false, linkMenuOpen: true });
  };

  handleCloseLinkMenu = () => {
    this.setState({ linkMenuOpen: false });
  };

  handleOpenBlockMenu = (search: string) => {
    this.setState({ blockMenuOpen: true, blockMenuSearch: search });
  };

  handleCloseBlockMenu = () => {
    if (!this.state.blockMenuOpen) return;
    this.setState({ blockMenuOpen: false });
  };

  handleSelectRow = (index: number, state: EditorState) => {
    this.view.dispatch(selectRow(index)(state.tr));
  };

  handleSelectColumn = (index: number, state: EditorState) => {
    this.view.dispatch(selectColumn(index)(state.tr));
  };

  handleSelectTable = (state: EditorState) => {
    this.view.dispatch(selectTable(state.tr));
  };

  // 'public' methods
  focusAtStart = () => {
    const selection = Selection.atStart(this.view.state.doc);
    const transaction = this.view.state.tr.setSelection(selection);
    this.view.dispatch(transaction);
    this.view.focus();
  };

  focusAtEnd = () => {
    const selection = Selection.atEnd(this.view.state.doc);
    const transaction = this.view.state.tr.setSelection(selection);
    this.view.dispatch(transaction);
    this.view.focus();
  };

  getHeadings = () => {
    const headings: { title: string; level: number; id: string }[] = [];
    const previouslySeen = {};

    this.view.state.doc.forEach(node => {
      if (node.type.name === 'heading') {
        // calculate the optimal slug
        const slug = headingToSlug(node);
        let id = slug;

        // check if we've already used it, and if so how many times?
        // Make the new id based on that number ensuring that we have
        // unique ID's even when headings are identical
        if (previouslySeen[slug] > 0) {
          id = headingToSlug(node, previouslySeen[slug]);
        }

        // record that we've seen this slug for the next loop
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

  theme = () => {
    return this.props.theme || (this.props.dark ? darkTheme : lightTheme);
  };

  dictionary = memoize(
    (providedDictionary?: Partial<typeof baseDictionary>) => {
      return { ...baseDictionary, ...providedDictionary };
    },
  );

  render() {
    const {
      dir,
      readOnly,
      readOnlyWriteCheckboxes,
      style,
      tooltip,
      className,
      onKeyDown,
    } = this.props;
    const { isRTL } = this.state;
    const dictionary = this.dictionary(this.props.dictionary);

    if (this.unmounted) {
      return <div ref={ref => (this.element = ref)} />;
    }

    return (
      <Flex
        onKeyDown={onKeyDown}
        style={style}
        className={className}
        align="flex-start"
        justify="center"
        dir={dir}
        column
      >
        <ThemeProvider theme={this.theme()}>
          <React.Fragment>
            <StyledEditor
              dir={dir}
              rtl={isRTL}
              readOnly={readOnly}
              readOnlyWriteCheckboxes={readOnlyWriteCheckboxes}
              ref={ref => (this.element = ref)}
            />
            {!readOnly && this.view && (
              <React.Fragment>
                <SelectionToolbar
                  view={this.view}
                  dictionary={dictionary}
                  commands={this.commands}
                  rtl={isRTL}
                  isTemplate={this.props.template === true}
                  onOpen={this.handleOpenSelectionMenu}
                  onClose={this.handleCloseSelectionMenu}
                  onSearchLink={this.props.onSearchLink}
                  onClickLink={this.props.onClickLink}
                  onCreateLink={this.props.onCreateLink}
                  tooltip={tooltip}
                />
                <LinkToolbar
                  view={this.view}
                  dictionary={dictionary}
                  isActive={this.state.linkMenuOpen}
                  onCreateLink={this.props.onCreateLink}
                  onSearchLink={this.props.onSearchLink}
                  onClickLink={this.props.onClickLink}
                  onShowToast={this.props.onShowToast}
                  onClose={this.handleCloseLinkMenu}
                  tooltip={tooltip}
                />
                <EmojiMenu
                  view={this.view}
                  commands={this.commands}
                  dictionary={dictionary}
                  rtl={isRTL}
                  isActive={this.state.emojiMenuOpen}
                  search={this.state.blockMenuSearch}
                  onClose={() => this.setState({ emojiMenuOpen: false })}
                />
                <BlockMenu
                  view={this.view}
                  commands={this.commands}
                  dictionary={dictionary}
                  rtl={isRTL}
                  isActive={this.state.blockMenuOpen}
                  search={this.state.blockMenuSearch}
                  onClose={this.handleCloseBlockMenu}
                  uploadImage={this.props.uploadImage}
                  onLinkToolbarOpen={this.handleOpenLinkMenu}
                  onImageUploadStart={this.props.onImageUploadStart}
                  onImageUploadStop={this.props.onImageUploadStop}
                  onShowToast={this.props.onShowToast}
                  embeds={this.props.embeds}
                />
              </React.Fragment>
            )}
          </React.Fragment>
        </ThemeProvider>
      </Flex>
    );
  }
}

export default RichMarkdownEditor;
