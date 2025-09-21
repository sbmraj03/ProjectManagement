import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Dashboard component - displays project and task statistics
 * Features:
 * - Task status overview with pie chart
 * - Recent pending tasks list
 * - Project count statistics
 * - Real-time data loading with error handling
 */
export default function Dashboard() {
    const { user, token, loading: authLoading } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // Load dashboard data (tasks, status counts)
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const response = await fetch(`${apiUrl}/projects/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Dashboard data loaded:', data);
                setDashboardData(data);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                // Set empty data structure to prevent blank screen
                setDashboardData({
                    tasks: [],
                    statusCounts: { ToDo: 0, InProgress: 0, Done: 0 }
                });
            }
        }
        
        if (token && !authLoading) {
            loadDashboardData();
        }
    }, [token, authLoading]);


    if (!token) {
        return <div className="p-6">Please log in to view the dashboard.</div>;
    }

    if (!dashboardData) {
        return (
            <div className="p-8 pr-12 pb-12">
                <div className="mb-8 mr-4">
                    <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
                    <p className="text-lg text-gray-600">
                        Welcome, <span className="font-semibold text-gray-800">{user?.name}</span>
                    </p>
                </div>
                
                {/* Loading Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mr-4">
                    <SkeletonLoader type="stats" count={4} />
                </div>
                
                {/* Loading Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mr-4">
                    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
                        <div className="space-y-4">
                            <SkeletonLoader type="task" count={3} />
                        </div>
                    </div>
                    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
                        <div className="flex justify-center">
                            <div className="w-72 h-72 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Chart data
    const chartData = {
        labels: ["ToDo", "InProgress", "Done"],
        datasets: [
            {
                data: [
                    dashboardData.statusCounts.ToDo,
                    dashboardData.statusCounts.InProgress,
                    dashboardData.statusCounts.Done,
                ],
                backgroundColor: ["#f87171", "#60a5fa", "#34d399"], // red, blue, green
                borderWidth: 2,
                borderColor: "#fff",
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <div className="p-8 pr-12 pb-12">
            <div className="mb-8 mr-4">
                <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
                <p className="text-lg text-gray-600">
                    Welcome, <span className="font-semibold text-gray-800">{user?.name}</span>
                                </p>
                            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mr-4">
                <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-4 rounded-full bg-red-100">
                            <div className="w-8 h-8 text-red-600 text-xl">📋</div>
                        </div>
                        <div className="ml-6">
                            <p className="text-lg font-medium text-gray-500">To Do</p>
                            <p className="text-3xl font-bold text-gray-900">{dashboardData.statusCounts.ToDo}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-4 rounded-full bg-blue-100">
                            <div className="w-8 h-8 text-blue-600 text-xl">⚡</div>
                        </div>
                        <div className="ml-6">
                            <p className="text-lg font-medium text-gray-500">In Progress</p>
                            <p className="text-3xl font-bold text-gray-900">{dashboardData.statusCounts.InProgress}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-4 rounded-full bg-green-100">
                            <div className="w-8 h-8 text-green-600 text-xl">✅</div>
                        </div>
                        <div className="ml-6">
                            <p className="text-lg font-medium text-gray-500">Completed</p>
                            <p className="text-3xl font-bold text-gray-900">{dashboardData.statusCounts.Done}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-4 rounded-full bg-purple-100">
                            <div className="w-8 h-8 text-purple-600 text-xl">📁</div>
                        </div>
                        <div className="ml-6">
                            <p className="text-lg font-medium text-gray-500">Total Projects</p>
                            <p className="text-3xl font-bold text-gray-900">{dashboardData.projects?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div> {/* ✅ Closed the stats overview grid here */}

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mr-4">
                {/* Pending Tasks Section */}
                <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Recent Pending Tasks</h2>
                    <div className="space-y-4">
                        {dashboardData.tasks
                            .filter((task) => task.status !== "Done")
                            .slice(0, 5)
                            .map((task) => (
                                <div
                                    key={task._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-lg">{task.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Project: {task.project?.title || "Unknown"}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                task.status === "ToDo"
                                                    ? "bg-red-100 text-red-800"
                                                    : task.status === "InProgress"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-green-100 text-green-800"
                                            }`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        {dashboardData.tasks.filter((task) => task.status !== "Done").length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-lg">No pending tasks!</p>
                                <p className="text-gray-400">Great job!</p>
                            </div>
                        )}
                </div>
            </div>

            {/* Chart Section */}
                <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Task Status Overview</h2>
                <div className="flex justify-center">
                        <div className="w-72 h-72">
                        <Pie data={chartData} options={chartOptions} />
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
