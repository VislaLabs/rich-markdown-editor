import { Path } from 'api/url';
import * as MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';

function isInline(token: Token) {
  return token.type === 'inline';
}

export default function() {
  function isMedia(image: Token) {
    const src = image.attrs[0][1];
    const path = new Path(src, window.location.origin);
    return path.media === 'video' ? path.to : undefined;
  }

  return function markdownMedia(md: MarkdownIt) {
    md.core.ruler.after('inline', 'media', state => {
      const tokens = state.tokens;

      for (let i = 0; i < tokens.length; i += 1) {
        if (isInline(tokens[i])) {
          const tokenChildren = tokens[i].children || [];

          for (let j = 0; j < tokenChildren.length; j += 1) {
            const current = tokenChildren[j];
            if (!current) continue;

            if (current.type === 'image') {
              const src = isMedia(current);
              if (src) {
                // convert to media token
                const token = new Token('media', 'video', 0);
                token.attrSet('src', src);
                tokenChildren.splice(j, 1, token);
              }
            }
          }
        }
      }

      return false;
    });
  };
}
