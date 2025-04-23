import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useTheme } from "../../hooks/use-theme";

import { overviewData, recentSalesData, topProducts } from  "../../constants/index";

import { Footer } from "../../layouts/footer";

import { CreditCard, DollarSign, Package, PencilLine, Star, Trash, TrendingUp, Users } from "lucide-react";



const DashboardPage = () => {
    const { theme } = useTheme();

    return (
      
            <h1 className="title">Dashboard</h1>
           );
};

export default DashboardPage;
