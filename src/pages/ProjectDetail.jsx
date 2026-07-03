import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { canEditModules } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  User, 
  Clock, 
  AlertOctagon, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentRole = useAuthStore(state => state.currentRole);

  const { projects, modules, fetchProjects, fetchModules, addModule, updateModule, deleteModule } = useProjectStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  // Form states for Module
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Pending');
  const [percentComplete, setPercentComplete] = useState(0);
  const [currentActivity, setCurrentActivity] = useState('');
  const [effortsHours, setEffortsHours] = useState(0);
  const [blockers, setBlockers] = useState('');
  const [owner, setOwner] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [eta, setEta] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchProjects(currentRole);
    fetchModules(currentRole);
  }, [currentRole]);

  // Find current project
  const project = projects.find(p => p.id === id);
  
  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate('/projects')} icon={ArrowLeft}>Back to Projects</Button>
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-500 italic">Project not found or loading...</p>
        </div>
      </div>
    );
  }

  // Filter modules for this project
  const projectModules = modules.filter(m => m.projectId === id);

  const KANBAN_COLUMNS = [
    { title: 'Pending', statusKey: 'Pending' },
    { title: 'WIP', statusKey: 'WIP' },
    { title: 'UAT', statusKey: 'UAT' },
    { title: 'Testing', statusKey: 'Testing' },
    { title: 'Hold', statusKey: 'Hold' },
    { title: 'Deployment', statusKey: 'Deployment' },
    { title: 'Complete', statusKey: 'Complete' }
  ];

  const handleOpenAdd = () => {
    setEditingModule(null);
    setName('');
    setStatus('Pending');
    setPercentComplete(0);
    setCurrentActivity('');
    setEffortsHours(0);
    setBlockers('');
    setOwner('');
    setPlannedEndDate(new Date().toISOString().split('T')[0]);
    setEta('');
    setRemarks('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mod) => {
    setEditingModule(mod);
    setName(mod.name);
    setStatus(mod.status);
    setPercentComplete(mod.percentComplete);
    setCurrentActivity(mod.currentActivity || '');
    setEffortsHours(mod.effortsHours || 0);
    setBlockers(mod.blockers || '');
    setOwner(mod.owner);
    setPlannedEndDate(mod.plannedEndDate);
    setEta(mod.eta || '');
    setRemarks(mod.remarks || '');
    setIsModalOpen(true);
  };

  const handleDelete = (modId) => {
    if (confirm("Are you sure you want to delete this module?")) {
      deleteModule(modId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      projectId: id,
      name,
      status,
      percentComplete: Number(percentComplete),
      currentActivity,
      effortsHours: Number(effortsHours),
      blockers,
      owner,
      plannedEndDate,
      eta,
      remarks
    };

    if (editingModule) {
      updateModule({ id: editingModule.id, ...payload });
    } else {
      addModule(payload);
    }
    setIsModalOpen(false);
  };

  const canEdit = canEditModules(currentRole);

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/projects')} icon={ArrowLeft}>
          Back to Projects
        </Button>
        {canEdit && (
          <Button variant="primary" onClick={handleOpenAdd} icon={Plus}>
            Add Module
          </Button>
        )}
      </div>

      {/* Project Meta Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-150">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{project.client}</span>
              <Badge value={project.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">{project.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{project.remarks}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs border-l border-slate-100 dark:border-slate-800 pl-6">
            <div>
              <span className="text-slate-400 block">Lead / Owner</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{project.owner}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Start Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatDate(project.startDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Target Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatDate(project.plannedEndDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {KANBAN_COLUMNS.map((col) => {
          const colModules = projectModules.filter(
            (m) => m.status.toLowerCase() === col.statusKey.toLowerCase()
          );

          return (
            <div 
              key={col.title} 
              className="w-80 shrink-0 bg-slate-100/60 dark:bg-slate-950/30 rounded-2xl p-4 flex flex-col border border-slate-200/50 dark:border-slate-800/40"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider">{col.title}</h3>
                  <span className="bg-slate-200/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {colModules.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {colModules.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 italic">
                    No modules
                  </div>
                ) : (
                  colModules.map((mod) => (
                    <div
                      key={mod.id}
                      onClick={() => handleOpenEdit(mod)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {mod.name}
                        </h4>
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(mod.id);
                            }}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Current Activity / Remarks */}
                      {mod.currentActivity && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-850 p-2 rounded">
                          <strong>Active:</strong> {mod.currentActivity}
                        </p>
                      )}

                      {/* Blockers Flag */}
                      {mod.blockers && (
                        <div className="flex items-center gap-1 text-[10px] text-red-600 font-semibold bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                          <AlertOctagon size={11} />
                          <span className="truncate">Blocker: {mod.blockers}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
                          <span>Progress</span>
                          <span>{mod.percentComplete}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              mod.status === 'Complete' ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'
                            }`}
                            style={{ width: `${mod.percentComplete}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <User size={11} />
                          {mod.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {mod.eta ? `ETA: ${formatDate(mod.eta)}` : `Due: ${formatDate(mod.plannedEndDate)}`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? "Edit Module Details" : "Create New Module"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              {editingModule ? "Save Changes" : "Create Module"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Module Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Insulin Pen VR Training"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="WIP">WIP</option>
                <option value="UAT">UAT</option>
                <option value="Testing">Testing</option>
                <option value="Hold">Hold</option>
                <option value="Deployment">Deployment</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Percent Complete (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={percentComplete}
                onChange={(e) => setPercentComplete(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Efforts Hours (Spent)</label>
              <input
                type="number"
                required
                value={effortsHours}
                onChange={(e) => setEffortsHours(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Lead / Owner</label>
              <input
                type="text"
                required
                placeholder="e.g. Hemnath"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">ETA (Actual End Date)</label>
              <input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Current Activity</label>
            <input
              type="text"
              placeholder="What task is currently ongoing?"
              value={currentActivity}
              onChange={(e) => setCurrentActivity(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Blockers (if any)</label>
            <input
              type="text"
              placeholder="What is stopping this module's progress?"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
            <textarea
              placeholder="General remarks, customer feedback..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
