import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import documentation from '../doc.md';
import { Container, Content, Footer, Header } from 'rsuite';
import BackIcon from '@rsuite/icons/legacy/Left';

export const About = (props) => {
  const [detail, setDetail] = React.useState('');

  React.useEffect(async () => {
    setDetail(await (await fetch(documentation)).text());
  }, []);

  return (
    <Container>
      <Header>
        <span onClick={()=>{window.location.href=`#`}} style={{cursor: 'pointer'}}>
          {React.cloneElement(<BackIcon />, {
            style: {
              fontSize: '1.5rem',
            }
          })}
        </span>
        &nbsp;&nbsp;&nbsp;&nbsp;
        About
      </Header>
      <Container>
        <Content>
          <div className='documentation'>
            <ReactMarkdown children={detail} remarkPlugins={[remarkGfm]} />
          </div>
        </Content>
      </Container>
      <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
    </Container>
  );
};