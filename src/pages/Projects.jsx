import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { canEditProjects } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { 
  FolderPlus, 
  User, 
  Calendar, 
  Trash2, 
  Edit3, 
  ChevronRight,
  Briefcase
} from 'lucide-react';

export default function Projects() {
  const navigate = useNavigate();
  const currentRole = useAuthStore(state => state.currentRole);
  
  const { projects, fetchProjects, addProject, updateProject, deleteProject } = useProjectStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [owner, setOwner] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchProjects(currentRole);
  }, [currentRole]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setName('');
    setClient('');
    setStatus('Active');
    setStartDate(new Date().toISOString().split('T')[0]);
    setPlannedEndDate('');
    setOwner('');
    setRemarks('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, project) => {
    e.stopPropagation(); // Avoid triggering navigation to details
    setEditingProject(project);
    setName(project.name);
    setClient(project.client);
    setStatus(project.status);
    setStartDate(project.startDate);
    setPlannedEndDate(project.plannedEndDate);
    setOwner(project.owner);
    setRemarks(project.remarks || '');
    setIsModalOpen(true);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // Avoid triggering navigation to details
    if (confirm("Are you sure you want to delete this project? All associated modules will be deleted too.")) {
      deleteProject(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      client,
      status,
      startDate,
      plannedEndDate,
      owner,
      remarks
    };

    if (editingProject) {
      updateProject({ id: editingProject.id, ...payload });
    } else {
      addProject(payload);
    }
    setIsModalOpen(false);
  };

  const canEdit = canEditProjects(currentRole);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Projects Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your high-fidelity VR operations and digital twin projects.
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={handleOpenAdd} icon={FolderPlus}>
            Add Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-500 italic">No projects found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer relative group flex flex-col justify-between h-56"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {proj.client}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 transition-colors">
                      {proj.name}
                    </h3>
                  </div>
                  <Badge value={proj.status} />
                </div>

                {/* Remarks / description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {proj.remarks || "No description provided."}
                </p>
              </div>

              {/* Bottom details */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between mt-4">
                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-300">{proj.owner}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Due {formatDate(proj.plannedEndDate)}</span>
                  </div>
                </div>
                
                {/* Actions (visible on hover) */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <>
                      <button
                        onClick={(e) => handleOpenEdit(e, proj)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Project"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, proj.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  <ChevronRight size={16} className="text-slate-400 self-center" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Edit Project Details" : "Create New Project"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. AGI Modules 1-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Client Name</label>
              <input
                type="text"
                required
                placeholder="e.g. AGI Group"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Planned End Date</label>
              <input
                type="date"
                required
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Project Owner</label>
            <input
              type="text"
              required
              placeholder="e.g. Admin"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
            <textarea
              placeholder="Provide brief details about the project scope or milestones..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
