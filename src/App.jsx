
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

import ProtectedRoute from "./firebase/ProtectedRoute ";

import HomePage from "./Homepage/HomePage";

import LoginPage from "./auth/LoginPage";
import CustomerLayout from "./Customer/CustomerDash/routes/CustomerLayout";
import CustomAccSet from "./Customer/Booking/CustomAccSet";


import { ThemeProvider } from "./contexts/theme-context";
import Layout from "./AdminDash/routes/layout";
import DashboardPage from "./AdminDash/routes/dashboard/Dashboard";
import OrderManagement from "./AdminDash/routes/dashboard/OrderManagement";
import Booking from "./AdminDash/routes/dashboard/Booking";

import CustomHistory from "./Customer/CustomerDash/routes/dashboard/CustomHistory";
import Profile from "./Customer/CustomerDash/routes/dashboard/Profile";
import ScheduleOrder from "./Customer/CustomerDash/routes/dashboard/ScheduleOrder";



function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <HomePage />,
        },
        {
            path: "/login",
            element: <LoginPage />,
        },
        {
            path: "CustomAccSet",
            element: <CustomAccSet />,
        },


      
        {
            path: "/schedule",
            element: (
                <ProtectedRoute>
                    <CustomerLayout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <ScheduleOrder />,
                },
                {
                    path: "profile",
                    element: <Profile/>,
                },
                {
                    path: "orderhistory",
                    element: <CustomHistory/>,
                },
                {
                    path: "settings",
                   
                },
            ],
        },
        
       
        {
            path: "/dashboard",
            element: (
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <DashboardPage />,
                },
                {
                    path: "order",
                    element: <OrderManagement/>,
                },
                {
                    path: "booking-dash",
                    element: <Booking/>,
                },
                {
                    path: "history",
                  
                },
               
                {
                    path: "settings",
                   
                },
            ],
        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App; 