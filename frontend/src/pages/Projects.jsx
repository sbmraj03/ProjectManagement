import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchProjects, createProject } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";

/**
 * Projects page component - displays user's owned and invited projects
 * Features:
 * - Create, edit, and delete projects
 * - Real-time project filtering between owned/invited sections
 * - Modal forms for project management
 * - Responsive design with loading states
 */
export default function Projects() {
    const { user, token, loading: authLoading } = useContext(AuthContext);
    const { showSuccess, showError } = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [newProject, setNewProject] = useState({
        title: "",
        description: "",
        deadline: "",
    });

    useEffect(() => {
        async function loadProjects() {
            try {
                setLoading(true);
                const projectsData = await fetchProjects(token);
                setProjects(projectsData);
            } catch (error) {
                console.error('Error loading projects:', error);
            } finally {
                setLoading(false);
            }
        }
        
        if (token && user && !authLoading) {
            loadProjects();
        }
    }, [token, user, authLoading]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const data = await createProject(token, newProject);
            if (data._id) {
                showSuccess("Project created successfully!");
                
                // Ensure the project has owner data for proper filtering
                const projectWithOwner = {
                    ...data,
                    owner: data.owner || { _id: user._id, name: user.name, email: user.email }
                };
                
                console.log('Created project:', projectWithOwner);
                setProjects([...projects, projectWithOwner]);
                setNewProject({ title: "", description: "", deadline: "" });
                setIsModalOpen(false); // Close modal after successful creation
            } else {
                showError(data.message || "Error creating project");
            }
        } catch (error) {
            console.error('Error creating project:', error);
            showError("Error creating project");
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewProject({ title: "", description: "", deadline: "" }); // Reset form
    };

    const openEditModal = (project) => {
        setEditingProject(project);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProject(null);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/projects/${editingProject._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editingProject)
            });
            
            if (response.ok) {
                const updatedProject = await response.json();
                showSuccess('Project updated successfully!');
                setProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p));
                closeEditModal();
            } else {
                showError('Error updating project');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            showError('Error updating project');
        }
    };

    const handleDelete = async (projectId) => {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Project deleted successfully!');
                setProjects(projects.filter(p => p._id !== projectId));
            } else {
                showError('Error deleting project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            showError('Error deleting project');
        }
    };

    // Separate owned and invited projects with proper comparison
    const ownedProjects = projects.filter(project => {
        // Ensure we have both project owner and user data before comparison
        if (!project.owner || !user) return false;
        
        // Handle both string and object ID comparisons
        const ownerId = typeof project.owner === 'string' ? project.owner : project.owner._id;
        const userId = typeof user === 'string' ? user : user._id;
        
        return ownerId === userId;
    });
    
    const invitedProjects = projects.filter(project => {
        // Ensure we have both project owner and user data before comparison
        if (!project.owner || !user) return false;
        
        // Handle both string and object ID comparisons
        const ownerId = typeof project.owner === 'string' ? project.owner : project.owner._id;
        const userId = typeof user === 'string' ? user : user._id;
        
        return ownerId !== userId;
    });

    if (!token) {
        return <div className="p-6">Please log in to view projects.</div>;
    }

    if (authLoading) {
        return (
            <div className="p-8 pr-12 pb-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 mr-4 gap-4">
                    <div className="pr-4">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="text-center py-12">
                    <LoadingSpinner />
                    <p className="text-gray-500 text-lg mt-4">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 pr-12 pb-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 mr-4 gap-4">
                    <div className="pr-4">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>

                {/* Loading Owned Projects */}
                <div className="bg-white shadow-lg rounded-xl p-8 mr-4 mb-8">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
                        <SkeletonLoader type="card" count={3} />
                    </div>
                </div>

                {/* Loading Invited Projects */}
                <div className="bg-white shadow-lg rounded-xl p-8 mr-4 mb-8">
                    <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
                        <SkeletonLoader type="card" count={2} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 pr-12 pb-12">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 mr-4 gap-4">
                <div className="pr-4">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-3">Projects</h1>
                    <p className="text-base sm:text-lg text-gray-600">Manage your projects, <span className="font-semibold text-gray-800">{user?.name}</span></p>
                </div>
                <button 
                    onClick={openModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 text-base sm:text-lg w-full sm:w-auto"
                >
                    <span className="text-xl sm:text-2xl">+</span>
                    <span className="hidden sm:inline">Create Project</span>
                    <span className="sm:hidden">Create</span>
                </button>
            </div>

            {/* Owned Projects */}
            <div className="bg-white shadow-lg rounded-xl p-8 mr-4 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">My Projects</h2>
                {ownedProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg mb-4">No projects created yet.</p>
                        <p className="text-gray-400">Create your first project using the button above!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
                        {ownedProjects.map((project) => (
                            <div key={project._id} className="border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-blue-300 mb-4 bg-white relative">
                                <div className="flex justify-between items-start mb-3">
                                    <Link 
                                        to={`/projects/${project._id}`}
                                        className="flex-1"
                                    >
                                        <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-3 leading-tight">
                                            {project.title}
                                        </h3>
                                    </Link>
                                    <div className="flex gap-2 ml-3">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openEditModal(project);
                                            }}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Project"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(project._id);
                                            }}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Project"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <Link 
                                    to={`/projects/${project._id}`}
                                    className="block"
                                >
                                    {project.description && (
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                            {project.description}
                                        </p>
                                    )}
                                    <div className="text-sm text-gray-500 space-y-2 mt-4 pt-3 border-t border-gray-100">
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Owner:</span> 
                                            <span className="text-blue-600 font-medium">You</span>
                                        </p>
                                        {project.deadline && (
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Deadline:</span> 
                                                <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                            </p>
                                        )}
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Created:</span> 
                                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invited Projects */}
            <div className="bg-white shadow-lg rounded-xl p-8 mr-4 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Invited Projects</h2>
                {invitedProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg mb-4">No project invitations yet.</p>
                        <p className="text-gray-400">You'll see projects you're invited to here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
                        {invitedProjects.map((project) => (
                            <div key={project._id} className="border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-green-300 mb-4 bg-white">
                                <Link 
                                    to={`/projects/${project._id}`}
                                    className="block h-full"
                                >
                                    <h3 className="text-xl font-semibold text-green-600 hover:text-green-800 mb-3 leading-tight">
                                        {project.title}
                                    </h3>
                                    {project.description && (
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                            {project.description}
                                        </p>
                                    )}
                                    <div className="text-sm text-gray-500 space-y-2 mt-4 pt-3 border-t border-gray-100">
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Owner:</span> 
                                            <span>{project.owner?.name || "Unknown"}</span>
                                        </p>
                                        {project.deadline && (
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Deadline:</span> 
                                                <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                            </p>
                                        )}
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Created:</span> 
                                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <>
                    {/* Blurred Background */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"></div>
                    
                    {/* Modal Form */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
                        <div className="bg-white rounded-xl p-8 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                            <h2 className="text-2xl font-semibold text-gray-800">Create New Project</h2>
                            <button 
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 text-3xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Title
                                </label>
                                <input
                                    className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                    placeholder="Enter project title"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                                    placeholder="Enter project description"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    rows="4"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                    value={newProject.deadline}
                                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-6 mt-8 border-t border-gray-200">
                                <button 
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingProject && (
                <>
                    {/* Blurred Background */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"></div>
                    
                    {/* Modal Form */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
                        <div className="bg-white rounded-xl p-8 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                            <h2 className="text-2xl font-semibold text-gray-800">Edit Project</h2>
                            <button 
                                onClick={closeEditModal}
                                className="text-gray-500 hover:text-gray-700 text-3xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleEdit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Title
                                </label>
                                <input
                                    className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                    placeholder="Enter project title"
                                    value={editingProject.title}
                                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                                    placeholder="Enter project description"
                                    value={editingProject.description}
                                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                                    rows="4"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    className="border border-gray-300 p-4 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                    value={editingProject.deadline}
                                    onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-6 mt-8 border-t border-gray-200">
                                <button 
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
                                >
                                    Update Project
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
