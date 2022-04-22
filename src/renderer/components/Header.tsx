import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <nav>
        <ul>
          <li>
            <NavLink to="/">Process File</NavLink>
          </li>
          <li>
            <NavLink to="/combine-excel">Combine Excel</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
