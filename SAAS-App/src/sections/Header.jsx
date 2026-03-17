import { Link as LinkScroll } from "react-scroll";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const NavLink = ({ title, setIsOpen }) => (
  <LinkScroll
    onClick={() => setIsOpen(false)}
    to={title}
    offset={-100}
    spy
    smooth
    activeClass="nav-active"
    className="base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-p1 max-lg:my-4 max-lg:h5"
  >
    {title}
  </LinkScroll>
);

const Header = () => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 32);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
  className={clsx(
    "fixed top-0 left-0 z-50 w-full py-10 transition-all duration-500 max-lg:py-4",
    hasScrolled && "py-2 bg-black-100 backdrop-blur-[8px]",
  )}
>
  <div className="container flex items-center h-14 max-lg:px-5 px-8">
    {/* Mobile Logo - Left aligned for hamburger space */}
    <a className="lg:hidden cursor-pointer">
      <img 
        src="/images/xora.svg" 
        width={160} 
        height={55} 
        alt="Xora" 
      />
    </a>

    {/* Desktop Layout: Left Nav | Center Logo | Right Auth */}
    <div className="hidden lg:flex w-full items-center justify-between mx-auto max-w-6xl">
      {/* Left Nav */}
      <nav className="flex items-center gap-8">
        <NavLink title="features" setIsOpen={setIsOpen} />
        <div className="w-1 h-1 bg-current rounded-full dot" />
        <NavLink title="pricing" setIsOpen={setIsOpen} />
        <div className="w-1 h-1 bg-current rounded-full dot" />
        <NavLink title="faq" setIsOpen={setIsOpen} />
      </nav>

      {/* Center Logo */}
      <LinkScroll
        to="hero"
        offset={-250}
        spy
        smooth
        className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer"
      >
        <img
          src="/images/xora.svg"
          width={160}
          height={55}
          alt="Xora"
        />
      </LinkScroll>

      {/* Right Auth Buttons */}
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link
              to="/dashboard"
              className="base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-p1"
            >
              Dashboard
            </Link>
            <div className="w-1 h-1 bg-current rounded-full dot" />
            <button
              onClick={logout}
              className="base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-p1"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-p1"
            >
              Login
            </Link>
            <div className="w-1 h-1 bg-current rounded-full dot" />
            <Link
              to="/signup"
              className="base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-p1"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </div>

    {/* Mobile hamburger - right aligned */}
    <button
      className="lg:hidden ml-auto z-2 size-10 border-2 border-s4/25 rounded-full flex justify-center items-center"
      onClick={() => setIsOpen((prevState) => !prevState)}
    >
      <img
        src={`/images/${isOpen ? "close" : "magic"}.svg`}
        alt="menu"
        className="size-1/2 object-contain"
      />
    </button>
  </div>

  {/* Mobile sidebar - unchanged */}
  <div
    className={clsx(
      "w-full max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:w-full max-lg:bg-s2 max-lg:opacity-0 transition-opacity duration-300",
      isOpen ? "max-lg:opacity-100" : "max-lg:pointer-events-none",
    )}
  >
    {/* Your existing mobile sidebar content here - no changes needed */}
    <div className="max-lg:relative max-lg:flex max-lg:flex-col max-lg:min-h-screen max-lg:p-6 max-lg:overflow-hidden sidebar-before max-md:px-4">
      {/* ... rest of mobile nav unchanged ... */}
    </div>
  </div>
</header>

  );
};

export default Header;
