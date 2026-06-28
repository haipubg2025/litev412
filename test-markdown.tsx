import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const element = React.createElement(Markdown, {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeRaw],
  children: 'Hello <span style="color: #ff0000">World</span>'
});
console.log(renderToStaticMarkup(element));
