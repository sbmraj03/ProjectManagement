import { Link } from "react-router-dom";

export default function ProjectList({ projects }) {
  return (
    <ul className="space-y-2">
      {projects.map((p) => (
        <li key={p._id}>
          <Link to={`/projects/${p._id}`}>
            <div className="border rounded p-4 hover:bg-gray-100 cursor-pointer">
              <h2 className="font-semibold">{p.title}</h2>
              {p.description && (
                <p className="text-sm text-gray-600">{p.description}</p>
              )}
              {p.deadline && (
                <p className="text-xs text-gray-500">Deadline: {p.deadline.slice(0, 10)}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}


