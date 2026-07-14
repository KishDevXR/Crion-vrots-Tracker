import React, { useState, useEffect } from 'react';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { canViewBudget, canEditResources } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Wrench,
  Percent
} from 'lucide-react';

export default function Resources() {
  const currentRole = useAuthStore(state => state.currentRole);
  const currentUser = useAuthStore(state => state.currentUser);

  const { resources, fetchResources, addResource, updateResource, deleteResource } = useResourceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Developer');
  const [skills, setSkills] = useState('');
  const [weeklyPlannedHours, setWeeklyPlannedHours] = useState(40);
  const [utilizationPercent, setUtilizationPercent] = useState(80);
  const [hourlyRate, setHourlyRate] = useState(50);

  useEffect(() => {
    fetchResources(currentRole);
  }, [currentRole]);

  const handleOpenAdd = () => {
    setEditingResource(null);
    setName('');
    setRole('Developer');
    setSkills('');
    setWeeklyPlannedHours(40);
    setUtilizationPercent(80);
    setHourlyRate(50);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res) => {
    setEditingResource(res);
    setName(res.name);
    setRole(res.specialization || res.role);
    setSkills(res.skills ? res.skills.join(', ') : '');
    setWeeklyPlannedHours(res.weeklyPlannedHours);
    setUtilizationPercent(res.utilizationPercent);
    setHourlyRate(res.hourlyRate || 0);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this team resource?")) {
      deleteResource(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
    const payload = {
      name,
      role,
      skills: skillsArray,
      weeklyPlannedHours: Number(weeklyPlannedHours),
      utilizationPercent: Number(utilizationPercent)
    };

    // If authorized, save hourly rate
    if (canViewBudget(currentRole)) {
      payload.hourlyRate = Number(hourlyRate);
    }

    if (editingResource) {
      updateResource({ id: editingResource.id, ...payload });
    } else {
      addResource(payload);
    }
    setIsModalOpen(false);
  };

  const showRates = canViewBudget(currentRole);
  const isEditable = canEditResources(currentRole);

  // Utilization Chart data
  const chartData = resources.map(r => ({
    name: r.name,
    'Utilization %': r.utilizationPercent
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Team Resources</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Allocate C#, 3D modeling, QA, and DevOps specialists to active projects.
          </p>
        </div>
        {isEditable && (
          <Button variant="primary" onClick={handleOpenAdd} icon={UserPlus}>
            Add Member
          </Button>
        )}
      </div>

      {/* Utilization Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[260px] transition-colors duration-150">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">Resource Utilization Rate (%)</h3>
        
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  fontSize: '12px' 
                }} 
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Utilization %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                <th className="px-6 py-3.5">Name / Role</th>
                <th className="px-6 py-3.5">Skills / Competencies</th>
                <th className="px-6 py-3.5 text-center">Weekly Hours</th>
                <th className="px-6 py-3.5 text-center">Utilization</th>
                {showRates && <th className="px-6 py-3.5">Hourly Rate</th>}
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar name={res.name} />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{res.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{res.specialization || res.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {res.skills && res.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-700/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-750 dark:text-slate-300">
                    {res.weeklyPlannedHours} hrs
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      res.utilizationPercent > 100 
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                        : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                    }`}>
                      {res.utilizationPercent}%
                    </span>
                  </td>
                  {showRates && (
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      ₹{res.hourlyRate || 0} / hr
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {isEditable && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(res)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Edit details"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(res.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Remove resource"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingResource ? "Edit Team Resource" : "Add Team Resource"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              {editingResource ? "Save Changes" : "Add Resource"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Resource Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kishore Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Role / Specialization</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Unity Lead">Unity Lead</option>
                <option value="Senior Developer">Senior Developer</option>
                <option value="Developer">Developer</option>
                <option value="Junior Developer">Junior Developer</option>
                <option value="3D Artist">3D Artist</option>
                <option value="QA Lead">QA Lead</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Unity, C#, Photon Fusion, Blender"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Planned Weekly Hours</label>
              <input
                type="number"
                required
                value={weeklyPlannedHours}
                onChange={(e) => setWeeklyPlannedHours(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Utilization Rate (%)</label>
              <input
                type="number"
                required
                value={utilizationPercent}
                onChange={(e) => setUtilizationPercent(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showRates && (
              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Hourly Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </form>
      </Modal>

    </div>
  );
}
