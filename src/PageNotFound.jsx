import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "CheckIn": CheckIn,
    "Employees": Employees,
    "Reports": Reports,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};