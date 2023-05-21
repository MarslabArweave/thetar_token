import React from 'react';
import { 
  addPair,
  getBalance,
  uploadImage,
  downloadImage,
} from '../lib/api';
import { SubmitButton } from './SubmitButton/SubmitButton';
import { TextInput } from './TextInput/TextInput';
import { Container, Content, Footer, Header } from 'rsuite';
import BackIcon from '@rsuite/icons/legacy/Left';
import { useNavigate } from 'react-router-dom';

export const AddPair = (props) => {
  const navigate = useNavigate();

  const [tokenAddress, setTokenAddress] = React.useState();

  // React.useEffect(() => {
  //   getBalance('ar').then(async ret=>{
  //     if (ret.status === true) {
  //       setBalance(ret.result);
  //     }
  //   });
  // }, [props.walletConnect]);

  return (
    <Container>
      <Header>
        <span onClick={()=>{navigate(`/`)}} style={{cursor: 'pointer'}}>
          {React.cloneElement(<BackIcon />, {
            style: {
              fontSize: '1.5rem',
            }
          })}
        </span>
        &nbsp;&nbsp;&nbsp;&nbsp;
        Add Pair
      </Header>
      <Container>
        <Content>
          <div className='instruction'>
          ⚠️ ThetAR exchange adheres to the concept of community autonomy - Everyone can add trading pairs. 
          At the same time, in order to avoid flooding attacks, there is a fee for adding pairs(1000 $TAR).
        </div>
        <TextInput 
          title='Token address:'
          onChange={setTokenAddress}
          placeholder='e.g. KmGb0DGNRfSlQzBYkHRbZYU8TEwaiNtoO-AH-ln1dJg'
        />
        
        <SubmitButton 
          buttonText='Submit'
          buttonSize='Medium'
          submitTask={()=>addPair(tokenAddress)}
        />
        </Content>
      </Container>
      <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
    </Container>
  );
};