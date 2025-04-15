
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

import ProtectedRoute from "../../Yizzy/src/js/ProtectedRoute ";

import HomePage from "./Homepage/HomePage";
import LoginPage from "./auth/LoginPage";
import BookingAndTracking from "./Booking/BookingAndTracking";

import { ThemeProvider } from "./Dash/contexts/theme-context";
import Layout from "./Dash/routes/layout";
import DashboardPage from "./Dash/routes/dashboard/Dashboard";
import OrderManagement from "./Dash/routes/dashboard/OrderManagement";


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
                    path: "history",
                    element: <h1 className="title">Reports</h1>,
                },
                {
                    path: "booking-dash",
                    element: <h1 className="title">Customers</h1>,
                },
                {
                    path: "settings",
                    element: <h1 className="title">New Customer</h1>,
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