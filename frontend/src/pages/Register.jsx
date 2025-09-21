import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { registerUser } from "../utils/api";

export default function Register() {
  const { setToken, setUser } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await registerUser(form.name, form.email, form.password);
    if (data.token) {
      showSuccess("Registration successful! Welcome to the platform.");
      setToken(data.token);
      setUser(data.user);
      // Redirect to dashboard after successful registration
      navigate('/dashboard');
    } else {
      showError(data.message || "Error registering");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Register</h2>
        <div className="space-y-4">
          <input
            className="border border-gray-300 p-4 w-full rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className="border border-gray-300 p-4 w-full rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="border border-gray-300 p-4 w-full rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="password"
            placeholder="Enter your password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg w-full font-medium text-lg transition-colors shadow-md hover:shadow-lg mt-6"
        >
          Register
        </button>
      </form>
    </div>
  );
}
