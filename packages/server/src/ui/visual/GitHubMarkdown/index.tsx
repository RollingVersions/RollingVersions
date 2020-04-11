import React from 'react';
import Markdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async-light';
import SyntaxHighlighterStyle from 'react-syntax-highlighter/dist/esm/styles/prism/ghcolors';

const SyntaxHighligherSupportedLanguages: string[] = require('react-syntax-highlighter/dist/esm/languages/prism/supported-languages')
  .default;

export interface GitHubMarkdownProps {
  children: string;
  inline?: boolean;
}
function GitHubMarkdown({children, inline}: GitHubMarkdownProps) {
  if (inline) {
    return (
      <Markdown
        className="markdown"
        source={children}
        renderers={{
          paragraph: (props) => {
            return props.children;
          },
        }}
      />
    );
  }
  return (
    <Markdown
      className="markdown"
      source={children}
      renderers={{
        code: (props: {language: string | null; value: string}) => {
          const aliases = {
            ts: 'typescript',
            js: 'javascript',
          };
          const language: string | null = props.language
            ? props.language.toLowerCase() in aliases
              ? (aliases as any)[props.language.toLowerCase()]
              : props.language.toLowerCase()
            : null;
          return (
            <SyntaxHighlighter
              style={SyntaxHighlighterStyle}
              language={
                language &&
                SyntaxHighligherSupportedLanguages.includes(language)
                  ? language
                  : 'text'
              }
              children={props.value}
            />
          );
        },
      }}
    />
  );
}

export default React.memo(GitHubMarkdown);
