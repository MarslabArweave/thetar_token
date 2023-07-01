import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { WalletSelectButton } from './WalletSelectButton/WalletSelectButton';
import { Navbar, Nav } from 'rsuite';
import HomeIcon from '@rsuite/icons/legacy/Home';
import AddIcon from '@rsuite/icons/AddOutline';
import MyIcon from '@rsuite/icons/legacy/Book';
import MintIcon from '@rsuite/icons/legacy/PlusSquare';
import ContactIcon from '@rsuite/icons/legacy/AddressBook';
import TwitterIcon from '@rsuite/icons/legacy/Twitter';
import GithubIcon from '@rsuite/icons/legacy/Github';
import EmailIcon from '@rsuite/icons/Email';
import MoneyIcon from '@rsuite/icons/legacy/Bank';
import NavLogo from './NavLogo.png';

export const Navigation = (props) => {
  return (<>
    <div>
      <Navbar appearance='subtle'>
        <Navbar.Brand href="#">
          <img src={NavLogo} style={{position: 'relative', top: '-5px' , height: '2rem'}} />
        </Navbar.Brand>
        <Nav>
          <Nav.Menu title="Menu">
            <Link to="/" className='menuText'>
              <Nav.Item icon={<HomeIcon />}>Home</Nav.Item>
            </Link>
            <Link to="/addPair" className='menuText'>
              <Nav.Item icon={<AddIcon />}>Add Pair</Nav.Item>
            </Link>
            <a href='http://tarket.marslab.top' target='_blank'>
              <Nav.Item icon={<MoneyIcon />}>Buy $TAR</Nav.Item>
            </a>
            <a href='http://atomic-mint.marslab.top/token' target='_blank'>
              <Nav.Item icon={<MintIcon />}>Mint token</Nav.Item>
            </a>
            <Link to="/my" className='menuText'>
              <Nav.Item icon={<MyIcon />}>My</Nav.Item>
            </Link>
            <Nav.Menu icon={<ContactIcon />} title="Contact" className='menuText'>
              <a href='https://twitter.com/marslab_arweave' target='_blank'>
                <Nav.Item icon={<TwitterIcon />}>Twitter</Nav.Item>
              </a>
              <a href='https://github.com/MarslabArweave' target='_blank'>
                <Nav.Item icon={<GithubIcon />}>Github</Nav.Item>
              </a>
              <a href='mailto: marslab.2022@gmail.com' target='_blank'>
                <Nav.Item icon={<EmailIcon />}>E-mail</Nav.Item>
              </a>
            </Nav.Menu>
          </Nav.Menu>
        </Nav>
        <Nav pullRight>
          <WalletSelectButton setIsConnected={value => props.setIsWalletConnected(value)} />
        </Nav>
      </Navbar>
    </div>
  </>); 
}
