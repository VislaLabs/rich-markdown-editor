import React from 'react';
import { Plugin } from 'prosemirror-state';
import Node from './Node';
import embedsRule from '../rules/embeds';

const cache = {};

const insertPlugin = (options, embeds) =>
  new Plugin({
    props: {
      // decorations(state) {
      //   return [{ class: 'modules' }];
      // },
      handleDOMEvents: {
        drop(view, event: DragEvent): boolean {
          if (
            (view.props.editable && !view.props.editable(view.state)) ||
            !embeds?.length
          ) {
            return false;
          }

          const href = event.dataTransfer.getData('URL');
          if (!href) {
            return false;
          }
          let match = false;
          for (const embed of embeds) {
            const matches = embed.matcher(href);
            if (matches) {
              match = true;
              break;
            }
          }
          if (!match) {
            return false;
          }

          // grab the position in the document for the cursor
          const result = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (result) {
            event.preventDefault();
            // const [from, to] = result;
            const { schema, tr } = view.state;

            view.dispatch(
              tr
                .replaceSelectionWith(schema.nodes.embed.create({ href }))
                .scrollIntoView(),
            );

            // insertFiles(view, event, result.pos, files, options);
            // insert a placeholder at this position, or mark an existing image as being
            // replaced
            // tr.setMeta(uploadPlaceholderPlugin, {
            //   add: {
            //     id,
            //     file,
            //     pos: result.pos,
            //     replaceExisting: options.replaceExisting,
            //   },
            // });
            // view.dispatch(tr);
            // view.dispatch(
            //   view.state.tr
            //     .replaceWith(
            //       from,
            //       to || from,
            //       schema.nodes.media.create({ src }),
            //     )
            //     .setMeta(uploadPlaceholderPlugin, { remove: { id } }),
            // );

            return true;
          }

          return false;
        },
      },
    },
  });

export default class Embed extends Node {
  ref: React.MutableRefObject<HTMLElement> = React.createRef();

  get name() {
    return 'embed';
  }

  get schema() {
    return {
      // content: 'inline*',
      group: 'block',
      atom: true,
      leaf: true,
      selectable: true,
      draggable: false,
      attrs: {
        href: {},
      },
      parseDOM: [
        {
          tag: 'iframe[class=modules]',
          getAttrs: (dom: HTMLIFrameElement) => {
            const { embeds } = this.editor.props;
            const href = dom.getAttribute('src') || '';

            if (embeds) {
              for (const embed of embeds) {
                const matches = embed.matcher(href);
                if (matches) {
                  return {
                    href,
                  };
                }
              }
            }

            return {};
          },
        },
      ],
      toDOM: node => [
        'iframe',
        {
          class: 'modules',
          src: node.attrs.href,
          contentEditable: false,
        },
        0,
      ],
    };
  }

  get rulePlugins() {
    return [embedsRule(this.options.embeds)];
  }

  component({ isEditable, isSelected, theme, node }) {
    const { embeds, navigate } = this.editor.props as any;
    if (!node.ref) {
      node.ref = React.createRef();
    }

    // matches are cached in module state to avoid re running loops and regex
    // here. Unfortuantely this function is not compatible with React.memo or
    // we would use that instead.
    const hit = cache[node.attrs.href];
    let Component = hit ? hit.Component : undefined;
    let matches = hit ? hit.matches : undefined;

    if (!Component) {
      for (const embed of embeds) {
        const m = embed.matcher(node.attrs.href);
        if (m) {
          Component = embed.component;
          matches = m;
          cache[node.attrs.href] = { Component, matches };
        }
      }
    }

    if (!Component) {
      return null;
    }

    return (
      <Component
        ref={node.ref}
        attrs={{ ...node.attrs, matches }}
        setAttrs={attrs => {
          const { view } = this.editor;
          const { tr } = view.state;
          const element = node.ref.current;
          if (element) {
            const { top, left } = element.getBoundingClientRect();
            const result = view.posAtCoords({ top, left });

            if (result) {
              const transaction = tr.setNodeMarkup(
                result.inside,
                undefined,
                attrs,
              );
              view.dispatch(transaction);
            }
          }
        }}
        navigate={navigate}
        isEditable={isEditable}
        isSelected={isSelected}
        theme={theme}
      />
    );
  }

  commands({ type }) {
    return attrs => (state, dispatch) => {
      dispatch(
        state.tr.replaceSelectionWith(type.create(attrs)).scrollIntoView(),
      );
      return true;
    };
  }

  toMarkdown(state, node) {
    state.ensureNewLine();
    state.write(
      '[' +
        state.esc(node.attrs.href) +
        '](' +
        state.esc(node.attrs.href) +
        ')',
    );
    state.write('\n\n');
  }

  parseMarkdown() {
    return {
      node: 'embed',
      getAttrs: token => ({
        href: token.attrGet('href'),
      }),
    };
  }

  get plugins() {
    const { embeds } = this.editor.props;
    return [insertPlugin(this.options, embeds)];
  }
}
