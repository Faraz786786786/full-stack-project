import React, { useState, useRef, useEffect, useContext } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, setToken, userData } = useContext(AppContext)
  const [showMenu, setShowMenu] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const logout = () => {
    setToken(false)
    localStorage.removeItem('token')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="Logo" />

      {/* Desktop Nav */}
      <ul className='hidden md:flex items-start gap-5 font-medium'>
        <NavLink to='/'>
          <li className='py-1'>HOME</li>
        </NavLink>
        <NavLink to='/doctors'>
          <li className='py-1'>ALL DOCTORS</li>
        </NavLink>
        <NavLink to='/about'>
          <li className='py-1'>ABOUT</li>
        </NavLink>
        <NavLink to='/contact'>
          <li className='py-1'>CONTACT</li>
        </NavLink>
        <NavLink to={import.meta.env.VITE_ADMIN_URL} target="_blank" rel="noopener noreferrer">
          <li className=' border px-5 text-xs py-1.5 rounded-full'>ADMIN PANEL</li>
        </NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {
          token && userData
            ? (
              <div className='flex items-center gap-2 cursor-pointer relative' onClick={() => setIsDropdownOpen(!isDropdownOpen)} ref={dropdownRef}>
                <img className='w-8 rounded-full' src={userData.image} alt="Profile" />
                <img className='w-2.5' src={assets.dropdown_icon} alt="Dropdown" />

                {isDropdownOpen && (
                  <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20'>
                    <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                      <p onClick={() => { navigate('/my-profile'); setIsDropdownOpen(false); }} className='hover:text-black cursor-pointer'>My Profile</p>
                      <p onClick={() => { navigate('/my-appointments'); setIsDropdownOpen(false); }} className='hover:text-black cursor-pointer'>My Appointment</p>
                      <p onClick={() => { logout(); setIsDropdownOpen(false); }} className='hover:text-black cursor-pointer'>Logout</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className='bg-[#5f6fff] text-white px-8 py-3 rounded-full font-light hidden md:block'>
                Create account
              </button>
            )}

        {/* Mobile Menu Button */}
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="Menu" />

        {/* Mobile Menu */}
        <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt="Logo" />
            <img className='w-7' onClick={() => setShowMenu(false)} src={assets.cross_icon} alt="Close" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/' className={({ isActive }) =>
              isActive ? 'text-white bg-[#5f6fff] sm:text-lg md:text-xl' : 'text-gray-700 sm:text-base md:text-lg'
            }>
              <p className='px-4 py-2 rounded inline-block'>HOME</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' className={({ isActive }) =>
              isActive ? 'text-white bg-[#5f6fff] sm:text-lg md:text-xl' : 'text-gray-700 sm:text-base md:text-lg'
            }>
              <p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' className={({ isActive }) =>
              isActive ? 'text-white bg-[#5f6fff] sm:text-lg md:text-xl' : 'text-gray-700 sm:text-base md:text-lg'
            }>
              <p className='px-4 py-2 rounded inline-block'>ABOUT</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' className={({ isActive }) =>
              isActive ? 'text-white bg-[#5f6fff] sm:text-lg md:text-xl' : 'text-gray-700 sm:text-base md:text-lg'
            }>
              <p className='px-4 py-2 rounded inline-block'>CONTACT</p>
            </NavLink>

            <NavLink onClick={() => setShowMenu(false)} to={import.meta.env.VITE_ADMIN_URL} className={({ isActive }) =>
              isActive ? 'text-white bg-[#5f6fff] sm:text-lg md:text-xl' : 'text-gray-700 sm:text-base md:text-lg'
            }>
              <p className='px-4 py-2  rounded inline-block'>Admin</p>
            </NavLink>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
