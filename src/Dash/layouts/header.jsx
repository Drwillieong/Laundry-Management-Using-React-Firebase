import { useTheme } from "../hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { ChevronsLeft, Moon, Sun, ChevronDown, User, LogOut } from "lucide-react";
import profileImg from "../../assets/pusa.jpeg";
import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";


export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
     const navigate = useNavigate();
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-pink-500 px-4 shadow-md transition-colors dark:bg-slate-900">
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft   className={collapsed && "rotate-180"} />
                </button>
            </div>
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                    <Sun
                        size={55}
                        className="dark:hidden"
                    />
                    <Moon
                        size={30}
                        className="hidden dark:block"
                    />
                </button>
                <div className="relative" ref={dropdownRef}>
                    <button 
                        className="flex items-center gap-2 overflow-hidden rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="size-8 overflow-hidden rounded-full">
                            <img
                                src={profileImg}
                                alt="profile image"
                                className="size-full object-cover"
                            />
                        </div>
                        <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800">
                            <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={() => {
                                    // Handle account click
                                    setDropdownOpen(false);
                                }}
                            >
                                <User size={16} />
                                <span>Account</span>
                            </button>
                          <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={() => {            
                                    
                                    setDropdownOpen(false);
                                    navigate('/login');
                                }}
                                
                            >
                                <LogOut size={16} />
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};