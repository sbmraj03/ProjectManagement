import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Search() {
  const { token } = useContext(AuthContext);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priority: "",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTasks = async () => {
    if (!token) {
      setError("Please log in to search tasks");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      // Only add non-empty parameters
      if (filters.q) params.append('q', filters.q);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = `${apiUrl}/tasks/search?${params}`;
      console.log('Search URL:', url);
      console.log('Search params:', params.toString());
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // Don't auto-fetch on mount, let user search manually
      console.log('Token available:', !!token);
    }
  }, [token]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  if (!token) {
    return (
      <div className="p-8 pr-12 pb-12">
        <div className="mb-8 mr-4">
          <h1 className="text-3xl font-bold mb-3">Search Tasks</h1>
          <p className="text-lg text-gray-600">Please log in to search tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pr-12 pb-12">
      <div className="mb-8 mr-4">
        <h1 className="text-3xl font-bold mb-3">Search Tasks</h1>
      </div>


      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8 mr-4 border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Search Filters</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="q"
              placeholder="Search keyword..."
              value={filters.q}
              onChange={handleChange}
              className="border border-gray-300 p-4 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="border border-gray-300 p-4 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="ToDo">ToDo</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleChange}
              className="border border-gray-300 p-4 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium text-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
        
        {/* Sorting Controls */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Sort Results</h3>
          <div className="flex gap-4 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              onClick={fetchTasks}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Apply Sort
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 mr-4">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mr-4">
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* Outer ring */}
                <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                
                {/* Inner ring */}
                <div className="absolute top-1 left-1 w-10 h-10 border-4 border-gray-100 rounded-full">
                  <div className="w-full h-full border-4 border-transparent border-t-blue-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                </div>
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-center text-gray-600 font-medium animate-pulse">Searching tasks...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && hasSearched && (
        <div className="mr-4">
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Search Results ({tasks.length} tasks found)
            </h2>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">No tasks found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your search filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((t) => (
                  <div key={t._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                    <h3 className="font-bold text-xl mb-3 text-gray-800">{t.title}</h3>
                    {t.description && (
                      <p className="text-gray-600 mb-4 leading-relaxed">{t.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Project:</span>
                        <span className="text-gray-600">{t.project?.title || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Assignee:</span>
                        <span className="text-gray-600">{t.assignee?.name || "Unassigned"}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        t.status === "ToDo" ? "bg-red-100 text-red-800" :
                        t.status === "InProgress" ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {t.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        t.priority === "High" ? "bg-red-100 text-red-800" :
                        t.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {t.priority || "No Priority"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial State - Show when no search has been performed */}
      {!loading && !error && !hasSearched && (
        <div className="mr-4">
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Search Tasks</h3>
              <p className="text-gray-500">Use the search filters above to find tasks across your projects.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
