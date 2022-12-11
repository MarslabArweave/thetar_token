import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import documentation from '../doc.md';

export const About = (props) => {
  const [detail, setDetail] = React.useState('');

  React.useEffect(async () => {
    setDetail(await (await fetch(documentation)).text());
  }, []);

  return (
    <div className='documentation'>
      <ReactMarkdown children={detail} remarkPlugins={[remarkGfm]} />
    </div>
  );
};