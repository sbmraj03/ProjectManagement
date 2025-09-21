import { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { io } from "socket.io-client";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

export default function ProjectDetail() {
    const { id } = useParams();
    const { token, user, setUser } = useContext(AuthContext);
    const { showSuccess, showError } = useToast();
    const [tasks, setTasks] = useState([]);
    const [project, setProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        assignee: "",
        status: "ToDo",
        priority: "Medium",
        dueDate: ""
    });
    const socketRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchTasks(),
                    fetchProject(),
                    fetchCurrentUser()
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchCurrentUser = async () => {
        if (token && !user) {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const res = await fetch(`${apiUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data) {
                    setUser(data);
                    console.log('Fetched current user:', data);
                }
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        }
    };

    const fetchProject = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Fetched project:', data);
            console.log('Project owner:', data.owner);
            console.log('Current user:', user);
            setProject(data);
            
            // Set project members (owner + members)
            const members = [data.owner, ...(data.members || [])];
            setProjectMembers(members);
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    useEffect(() => {
        if (id) {
            // Create socket connection only once
            if (!socketRef.current) {
                const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
                socketRef.current = io(socketUrl);
            }

            const socket = socketRef.current;
            
            socket.emit("joinProject", id);

            socket.on("taskUpdated", (task) => {
                console.log("🔄 Task updated:", task);
                fetchTasks();
            });

            socket.on("taskCreated", () => fetchTasks());
            socket.on("taskDeleted", () => fetchTasks());
            socket.on("commentAdded", () => fetchTasks());

            return () => {
                socket.emit("leaveProject", id);
                socket.off("taskUpdated");
                socket.off("taskCreated");
                socket.off("taskDeleted");
                socket.off("commentAdded");
            };
        }
    }, [id]);

    // Cleanup socket on component unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const fetchTasks = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Fetched tasks:', data);
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            // Prepare task data - only include assignee if it's not empty
            const taskData = { 
                projectId: id, 
                title: newTask.title,
                description: newTask.description,
                status: newTask.status,
                priority: newTask.priority,
                dueDate: newTask.dueDate
            };
            
            // Only add assignee if it's provided and not empty
            if (newTask.assignee && newTask.assignee.trim() !== '') {
                taskData.assignee = newTask.assignee;
            }
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(taskData)
            });
            
            if (response.ok) {
                showSuccess('Task created successfully!');
                setNewTask({
                    title: "",
                    description: "",
                    assignee: "",
                    status: "ToDo",
                    priority: "Medium",
                    dueDate: ""
                });
                setIsTaskModalOpen(false);
                // Refresh tasks immediately
                await fetchTasks();
            } else {
                const errorData = await response.json();
                console.error('Error creating task:', errorData);
                showError('Error creating task: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating task:', error);
            showError('Error creating task: ' + error.message);
        }
    };

    const openTaskModal = () => {
        setIsTaskModalOpen(true);
    };

    const closeTaskModal = () => {
        setIsTaskModalOpen(false);
        setNewTask({
            title: "",
            description: "",
            assignee: "",
            status: "ToDo",
            priority: "Medium",
            dueDate: ""
        });
    };

    const openInviteModal = () => {
        setIsInviteModalOpen(true);
    };

    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
        setInviteEmail("");
    };

    const sendInvite = async (e) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/projects/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectId: id,
                    email: inviteEmail
                })
            });
            
            if (response.ok) {
                showSuccess('Invitation sent successfully!');
                setInviteEmail("");
                setIsInviteModalOpen(false);
            } else {
                const errorData = await response.json();
                showError('Error sending invitation: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            showError('Error sending invitation: ' + error.message);
        }
    };

    // Check if current user can update a task (assignee or project owner)
    const canUpdateTask = (task) => {
        if (!user || !project) return false;
        return (
            task.assignee?._id === user._id || 
            project.owner?._id === user._id
        );
    };

    const updateTask = async (taskId, updates) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await fetch(`${apiUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await fetch(`${apiUrl}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const addComment = async (taskId, text) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await fetch(`${apiUrl}/tasks/${taskId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });
            fetchTasks();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-8 pr-12 pb-12">
                <div className="mb-8 mr-4">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8 mr-4">
                    <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                
                <div className="space-y-6 mr-4">
                    <SkeletonLoader type="task" count={3} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 pr-12 pb-12">
            {/* Header with Project Info and Actions */}
            <div className="mb-8 mr-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Project Tasks</h1>
                        {project && (
                            <p className="text-lg text-gray-600 mt-2">
                                {project.title} • Owner: {project.owner?.name || "Unknown"}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex gap-4">                        
                        {/* Invite Member Button - Only for Project Owner */}
                        {project && user && project.owner?._id === user._id && (
                            <button 
                                onClick={openInviteModal}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg text-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Invite Member
                            </button>
                        )}
                        
                        <button 
                            onClick={openTaskModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg text-lg flex items-center gap-3"
                        >
                            <span className="text-2xl">+</span>
                            Add Task
                </button>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-6 mr-4">
                {tasks.map((task) => (
                    <div key={task._id} className="bg-slate-100 shadow-lg rounded-xl p-8 border border-gray-200">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1 pr-4">
                                <h2 className="font-bold text-xl mb-3 text-gray-800">{task.title}</h2>
                                
                                {task.description && (
                                    <p className="text-gray-600 leading-relaxed mb-4">{task.description}</p>
                                )}

                                {/* Task Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">Assignee:</span>
                                        <span className="text-gray-600">
                                            {task.assignee?.name || task.assignee || "Unassigned"}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">Priority:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            task.priority === "High" ? "bg-red-100 text-red-800" :
                                            task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                            "bg-green-100 text-green-800"
                                        }`}>
                                            {task.priority || "Medium"}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">Due Date:</span>
                                        <span className="text-gray-600">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            task.status === "ToDo" ? "bg-red-100 text-red-800" :
                                            task.status === "InProgress" ? "bg-blue-100 text-blue-800" :
                                            "bg-green-100 text-green-800"
                                        }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Task Controls - Only for assignee and project owner */}
                            {canUpdateTask(task) ? (
                                <div className="flex gap-3">
                                <select
                                    value={task.status}
                                    onChange={(e) => updateTask(task._id, { status: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ToDo">ToDo</option>
                                    <option value="InProgress">InProgress</option>
                                    <option value="Done">Done</option>
                                </select>
                                <button
                                    onClick={() => deleteTask(task._id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                                >
                                    Delete
                                </button>
                            </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic">
                                    You can only view this task. Only the assignee and project owner can update it.
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-lg font-semibold mb-4 text-gray-800">Comments</h4>
                            <div className="space-y-3 mb-4">
                            {task.comments?.map((c) => (
                                    <div key={c._id} className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-700">💬 {c.text}</p>
                                    </div>
                                ))}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const text = e.target.comment.value;
                                    if (text) addComment(task._id, text);
                                    e.target.reset();
                                }}
                                className="flex gap-3"
                            >
                                <input
                                    name="comment"
                                    placeholder="Add a comment..."
                                    className="border border-gray-300 rounded-lg p-3 flex-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                                >
                                    Post Comment
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>

            {/* Task Creation Modal */}
            {isTaskModalOpen && (
                <>
                    {/* Blurred Background */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"></div>
                    
                    {/* Modal Form */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
                        <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                <h2 className="text-2xl font-semibold text-gray-800">Create New Task</h2>
                                <button 
                                    onClick={closeTaskModal}
                                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <form onSubmit={createTask} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Task Title *
                                        </label>
                                        <input
                                            className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                            placeholder="Enter task title"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Assignee (Optional)
                                        </label>
                                        <select
                                            className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                            value={newTask.assignee}
                                            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                                        >
                                            <option value="">Select a team member</option>
                                            {projectMembers.map((member) => (
                                                <option key={member._id} value={member._id}>
                                                    {member.name} {member._id === project?.owner?._id ? '(Owner)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-sm text-gray-500 mt-1">Choose a team member to assign this task to</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                                        placeholder="Enter task description"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows="4"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                            value={newTask.status}
                                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                        >
                                            <option value="ToDo">ToDo</option>
                                            <option value="InProgress">InProgress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Priority
                                        </label>
                                        <select
                                            className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 pt-6 mt-8 border-t border-gray-200">
                                    <button 
                                        type="button"
                                        onClick={closeTaskModal}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Invite Member Modal */}
            {isInviteModalOpen && (
                <>
                    {/* Blurred Background */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"></div>
                    
                    {/* Modal Form */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
                        <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                <h2 className="text-2xl font-semibold text-gray-800">Invite Member</h2>
                                <button 
                                    onClick={closeInviteModal}
                                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <form onSubmit={sendInvite} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                                        placeholder="Enter member's email address"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        An invitation will be sent to this email address.
                                    </p>
                                </div>
                                
                                <div className="flex gap-4 pt-6 mt-8 border-t border-gray-200">
                                    <button 
                                        type="button"
                                        onClick={closeInviteModal}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                    >
                                        Send Invitation
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


