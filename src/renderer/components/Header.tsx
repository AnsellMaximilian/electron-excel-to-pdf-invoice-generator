import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <nav>
        <ul>
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/process">Process File</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
