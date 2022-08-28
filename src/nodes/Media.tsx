import * as React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import * as qs from 'query-string';
import { ThemeProvider } from 'styled-components';
import { DownloadIcon } from 'outline-icons';
import { Plugin, TextSelection, NodeSelection } from 'prosemirror-state';
import { InputRule } from 'prosemirror-inputrules';
import styled from 'styled-components';
import VideoZoom from 'react-medium-image-zoom';
import LanguageProvider from 'containers/LanguageProvider';
import mediaRules from '../rules/media';
import getDataTransferFiles from '../lib/getDataTransferFiles';
import uploadPlaceholderPlugin from '../lib/uploadPlaceholder';
import insertFiles from '../commands/insertFiles';
import Node from './Node';
import { Media as MediaComponent } from 'components/Renderer/Media';
import { Path } from 'api/url';

/**
 * Matches following attributes in Markdown-typed image: [, alt, src, class]
 *
 * Example:
 * ![Lorem](image.jpg) -> [, "Lorem", "image.jpg"]
 * ![](image.jpg "class") -> [, "", "image.jpg", "small"]
 * ![Lorem](image.jpg "class") -> [, "Lorem", "image.jpg", "small"]
 */
const MEDIA_INPUT_REGEX = /!\[(?<alt>[^\]\[]*?)]\((?<filename>[^\]\[]*?)(?=\“|\))\“?(?<layoutclass>[^\]\[\”]+)?\”?\)$/;

const uploadPlugin = options =>
  new Plugin({
    props: {
      handleDOMEvents: {
        paste(view, event: ClipboardEvent): boolean {
          if (
            (view.props.editable && !view.props.editable(view.state)) ||
            !options.uploadImage
          ) {
            return false;
          }

          if (!event.clipboardData) return false;

          // check if we actually pasted any files
          const files = Array.prototype.slice
            .call(event.clipboardData.items)
            .map(dt => dt.getAsFile())
            .filter(file => file);

          if (files.length === 0) return false;

          const { tr } = view.state;
          if (!tr.selection.empty) {
            tr.deleteSelection();
          }
          const pos = tr.selection.from;

          insertFiles(view, event, pos, files, options);
          return true;
        },
        drop(view, event: DragEvent): boolean {
          if (
            (view.props.editable && !view.props.editable(view.state)) ||
            !options.uploadImage
          ) {
            return false;
          }

          // filter to only include image files
          const files = getDataTransferFiles(event).filter(file =>
            /(image|video)/i.test(file.type),
          );
          if (files.length === 0) {
            return false;
          }

          // grab the position in the document for the cursor
          const result = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (result) {
            insertFiles(view, event, result.pos, files, options);
            return true;
          }

          return false;
        },
      },
    },
  });

const IMAGE_CLASSES = ['right-50', 'left-50'];
const getLayoutAndTitle = tokenTitle => {
  if (!tokenTitle) return {};
  if (IMAGE_CLASSES.includes(tokenTitle)) {
    return {
      layoutClass: tokenTitle,
    };
  } else {
    return {
      title: tokenTitle,
    };
  }
};

const downloadMediaNodeode = async node => {
  const image = await fetch(node.attrs.src);
  const imageBlob = await image.blob();
  const imageURL = URL.createObjectURL(imageBlob);
  const extension = imageBlob.type.split('/')[1];
  const potentialName = node.attrs.alt || 'media';

  // create a temporary link node and click it with our image data
  const link = document.createElement('a');
  link.href = imageURL;
  link.download = `${potentialName}.${extension}`;
  document.body.appendChild(link);
  link.click();

  // cleanup
  document.body.removeChild(link);
};

export default class Media extends Node {
  get name() {
    return 'media';
  }

  get schema() {
    return {
      inline: true,
      attrs: {
        src: {},
        alt: {
          default: null,
        },
        layoutClass: {
          default: null,
        },
        title: {
          default: null,
        },
      },
      content: 'text*',
      marks: '',
      group: 'inline',
      selectable: true,
      draggable: true,
      parseDOM: [
        {
          tag: 'div[class~=media]',
          getAttrs: (dom: HTMLVideoElement) => {
            const media =
              dom.getElementsByTagName('video')?.[0] ||
              dom.getElementsByTagName('image')?.[0];
            const className = dom.className;
            const layoutClassMatched =
              className && className.match(/video-(.*)$/);
            const layoutClass = layoutClassMatched
              ? layoutClassMatched[1]
              : null;
            const source = media.getElementsByTagName('source')?.[0];

            return {
              autoPlay: source?.getAttribute('autoplay'),
              poster: media?.getAttribute('poster'),
              playsInline: media?.getAttribute('playsinline'),
              muted: media?.getAttribute('muted'),
              width: media?.getAttribute('width'),
              height: media?.getAttribute('height'),
              loop: media?.getAttribute('loop'),
              src: source?.getAttribute('src'),
              type: source?.getAttribute('type'),
              layoutClass: layoutClass,
            };
          },
        },
      ],
      toDOM: node => {
        const path = new Path(node.attrs.src);
        const className = node.attrs.layoutClass
          ? `media media-${node.attrs.layoutClass}`
          : 'media';
        const { src, type, ...mediaAttrs } = node.atts;
        return [
          'div',
          {
            class: className,
          },
          [
            path.media === 'video' ? 'video' : 'img',
            { ...mediaAttrs, contentEditable: false },
            ['source', { src, type }],
          ],
          ['p', { class: 'caption' }, 0],
        ];
      },
    };
  }

  handleKeyDown = ({ node, getPos }) => event => {
    // Pressing Enter in the caption field should move the cursor/selection
    // below the image
    if (event.key === 'Enter') {
      event.preventDefault();

      const { view } = this.editor;
      const $pos = view.state.doc.resolve(getPos() + node.nodeSize);
      view.dispatch(
        view.state.tr.setSelection(new TextSelection($pos)).split($pos.pos),
      );
      view.focus();
      return;
    }

    // Pressing Backspace in an an empty caption field should remove the entire
    // image, leaving an empty paragraph
    if (event.key === 'Backspace' && event.target.innerText === '') {
      const { view } = this.editor;
      const $pos = view.state.doc.resolve(getPos());
      const tr = view.state.tr.setSelection(new NodeSelection($pos));
      view.dispatch(tr.deleteSelection());
      view.focus();
      return;
    }
  };

  handleBlur = ({ node, getPos }) => event => {
    const alt = event.target.innerText;
    const { src, title, layoutClass } = node.attrs;

    if (alt === node.attrs.alt) return;

    const { view } = this.editor;
    const { tr } = view.state;

    // update meta on object
    const pos = getPos();
    const transaction = tr.setNodeMarkup(pos, undefined, {
      src,
      alt,
      title,
      layoutClass,
    });
    view.dispatch(transaction);
  };

  handleSelect = ({ getPos }) => event => {
    event.preventDefault();

    const { view } = this.editor;
    const $pos = view.state.doc.resolve(getPos());
    const transaction = view.state.tr.setSelection(new NodeSelection($pos));
    view.dispatch(transaction);
  };

  handleDownload = ({ node }) => event => {
    event.preventDefault();
    event.stopPropagation();
    downloadMediaNodeode(node);
  };

  component = props => {
    const { isSelected } = props;
    const { alt, layoutClass, src } = props.node.attrs;
    const className = layoutClass
      ? `module media media-${layoutClass}`
      : 'media';

    return (
      <React.Suspense fallback={null}>
        <Provider store={(window as any).store}>
          <LanguageProvider messages={{}}>
            <MemoryRouter initialEntries={[src]}>
              <span
                contentEditable={false}
                className={
                  className + (isSelected ? ' ProseMirror-selectednode' : '')
                }
              >
                <MediaComponent
                // className={isSelected ? 'ProseMirror-selectednode' : ''}
                // onClick={this.handleSelect(props)}
                />
                <Caption
                  onKeyDown={this.handleKeyDown(props)}
                  onBlur={this.handleBlur(props)}
                  className="caption"
                  tabIndex={-1}
                  role="textbox"
                  contentEditable
                  suppressContentEditableWarning
                  data-caption={this.options.dictionary.imageCaptionPlaceholder}
                >
                  {alt}
                </Caption>
              </span>
            </MemoryRouter>
          </LanguageProvider>
        </Provider>
      </React.Suspense>
    );
  };

  get rulePlugins() {
    return [mediaRules()];
  }

  toMarkdown(state, node) {
    let markdown =
      ' ![' +
      state.esc((node.attrs.alt || '').replace('\n', '') || '') +
      '](' +
      state.esc(node.attrs.src);
    if (node.attrs.layoutClass) {
      markdown += ' "' + state.esc(node.attrs.layoutClass) + '"';
    } else if (node.attrs.title) {
      markdown += ' "' + state.esc(node.attrs.title) + '"';
    }
    markdown += ')';
    state.write(markdown);
  }

  parseMarkdown() {
    return {
      node: 'media',
      getAttrs: token => {
        return {
          src: token.attrGet('src'),
          // alt: (token.children[0] && token.children[0].content) || null,
          // ...getLayoutAndTitle(token.attrGet('title')),
        };
      },
    };
  }

  commands({ type }) {
    return {
      downloadMedia: () => async state => {
        const { node } = state.selection;

        if (node.type.name !== 'media') {
          return false;
        }

        downloadMediaNodeode(node);

        return true;
      },
      deleteMedia: () => (state, dispatch) => {
        dispatch(state.tr.deleteSelection());
        return true;
      },
      alignRight: () => (state, dispatch) => {
        const attrs = {
          ...state.selection.node.attrs,
          title: null,
          layoutClass: 'right-50',
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.from, undefined, attrs));
        return true;
      },
      alignLeft: () => (state, dispatch) => {
        const attrs = {
          ...state.selection.node.attrs,
          title: null,
          layoutClass: 'left-50',
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.from, undefined, attrs));
        return true;
      },
      replaceMedia: () => state => {
        const { view } = this.editor;
        const {
          uploadImage,
          onImageUploadStart,
          onImageUploadStop,
          onShowToast,
        } = this.editor.props;

        if (!uploadImage) {
          throw new Error('uploadImage prop is required to replace media');
        }

        // create an input element and click to trigger picker
        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.accept = 'image/*,video/*';
        inputElement.onchange = (event: Event) => {
          const files = getDataTransferFiles(event);
          insertFiles(view, event, state.selection.from, files, {
            uploadImage,
            onImageUploadStart,
            onImageUploadStop,
            onShowToast,
            dictionary: this.options.dictionary,
            replaceExisting: true,
          });
        };
        inputElement.click();
      },
      alignCenter: () => (state, dispatch) => {
        const attrs = { ...state.selection.node.attrs, layoutClass: null };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.from, undefined, attrs));
        return true;
      },
      createMedia: attrs => (state, dispatch) => {
        const { selection } = state;
        const position = selection.$cursor
          ? selection.$cursor.pos
          : selection.$to.pos;
        const node = type.create(attrs);
        const transaction = state.tr.insert(position, node);
        dispatch(transaction);
        return true;
      },
    };
  }

  inputRules({ type }) {
    return [
      new InputRule(MEDIA_INPUT_REGEX, (state, match, start, end) => {
        const [okay, alt, src, matchedTitle] = match;
        const { tr } = state;

        if (okay) {
          tr.replaceWith(
            start - 1,
            end,
            type.create({
              src,
              alt,
              ...getLayoutAndTitle(matchedTitle),
            }),
          );
        }

        return tr;
      }),
    ];
  }

  get plugins() {
    return [uploadPlugin(this.options)];
  }
}

const Button = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: 0;
  margin: 0;
  padding: 0;
  border-radius: 4px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.textSecondary};
  width: 24px;
  height: 24px;
  display: inline-block;
  cursor: pointer;
  opacity: 0;
  transition: opacity 100ms ease-in-out;

  &:active {
    transform: scale(0.98);
  }

  &:hover {
    color: ${props => props.theme.text};
    opacity: 1;
  }
`;

const Caption = styled.p`
  border: 0;
  display: block;
  font-size: 13px;
  font-style: italic;
  font-weight: normal;
  color: ${props => props.theme.textSecondary};
  padding: 2px 0;
  line-height: 16px;
  text-align: center;
  min-height: 1em;
  outline: none;
  background: none;
  resize: none;
  user-select: text;
  cursor: text;

  &:empty:not(:focus) {
    visibility: hidden;
  }

  &:empty:before {
    color: ${props => props.theme.placeholder};
    content: attr(data-caption);
    pointer-events: none;
  }
`;

const VideoWrapper = styled.span`
  line-height: 0;
  display: inline-block;
  position: relative;

  &:hover {
    ${Button} {
      opacity: 0.9;
    }
  }

  &.ProseMirror-selectednode + ${Caption} {
    visibility: visible;
  }
`;
