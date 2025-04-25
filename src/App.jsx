
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

import ProtectedRoute from "./firebase/ProtectedRoute ";

import HomePage from "./Homepage/HomePage";

import LoginPage from "./auth/LoginPage";
import BookingAndTracking from "./Customer/BookingAndTracking";
import UserProfile from "./Customer/UserProfile";

import { ThemeProvider } from "./Dash/contexts/theme-context";
import Layout from "./Dash/routes/layout";
import DashboardPage from "./Dash/routes/dashboard/Dashboard";
import OrderManagement from "./Dash/routes/dashboard/OrderManagement";
import Booking from "./Dash/routes/dashboard/Booking";



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
            path: "/userprofile",
            element:<UserProfile/>,
        },
        {
            path: "/booking",
            element: <BookingAndTracking />,
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