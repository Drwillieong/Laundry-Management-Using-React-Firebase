import {   NotepadText, Settings, Calendar,User } from "lucide-react";

import ProfileImage from "../../../assets/pusa.jpeg";
import ProductImage from "../../../assets/pusa.jpeg";

export const navbarLinks = [
    {
        title: "My Account",
        links: [
            {
                label: "Schedule a pickup",
                icon: Calendar,     
                path: "/schedule",
            },
            {
                label: "Profile",
                icon: User,
                path: "/schedule/profile",
            },
            {
                label: "Order History",
                icon: NotepadText,
                path: "/schedule/orderhistory",
            },
           
            {
                label: "Settings",
                icon: Settings,
                path: "/schedule/settings",
            },
        ],
    },
    
];

