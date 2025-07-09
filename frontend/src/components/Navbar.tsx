import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  BookOpen, 
  User, 
  FileText, 
  Bell, 
  LogOut, 
  Settings,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;

    logout();
    navigate('/login');
  };

  if (!user) {
    // return (
    //   <nav className="bg-primary-900 shadow-soft">
    //     <div className="container mx-auto px-4">
    //       <div className="flex justify-between items-center py-4">
    //         <div className="flex items-center space-x-2">
    //           <BookOpen className="h-8 w-8 text-secondary-300" />
    //           <span className="text-xl font-bold text-white">CampusConnect</span>
    //         </div>
    //         <div className="flex space-x-4">
    //           <Link
    //             to="/login"
    //             className="text-secondary-200 hover:text-white transition-colors duration-200"
    //           >
    //             Login
    //           </Link>
    //           <Link
    //             to="/register"
    //             className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors duration-200"
    //           >
    //             Register
    //           </Link>
    //         </div>
    //       </div>
    //     </div>
    //   </nav>
    // );
    return null;
  }

  const menuItems = user.role === 'admin'
    ? [
        { name: 'Dashboard', icon: Settings, path: '/dashboard' },
        { name: 'Assignments', icon: FileText, path: '/admin/assignments' },
        { name: 'Notices', icon: Bell, path: '/notices' },
        { name: 'Profile', icon: User, path: '/profile' },
      ]
    : [
        { name: 'Dashboard', icon: Settings, path: '/dashboard' },
        { name: 'Assignments', icon: FileText, path: '/assignments' },
        { name: 'Notices', icon: Bell, path: '/notices' },
        { name: 'Profile', icon: User, path: '/profile' },
      ];

  return (
    <nav className="bg-primary-900 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-secondary-300" />
            <span className="text-xl font-bold text-white">CampusConnect</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center space-x-1 text-secondary-200 hover:text-white transition-colors duration-200"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="flex items-center space-x-4 ml-6 border-l border-primary-700 pl-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-secondary-300 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-secondary-200 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-700">
            <div className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-2 text-secondary-200 hover:text-white transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="flex items-center space-x-2 pt-4 border-t border-primary-700">
                <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-secondary-300 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-secondary-200 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;