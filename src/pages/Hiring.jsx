import React, { useState, useEffect } from 'react';
import { useResourceStore } from '../store/resourceStore';
import { useAuthStore } from '../store/authStore';
import { canEditResources } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { 
  Briefcase, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Award,
  GraduationCap,
  MapPin
} from 'lucide-react';

export default function Hiring() {
  const currentRole = useAuthStore(state => state.currentRole);
  
  const { 
    hiringRequests, fetchHiringRequests, addHiringRequest, updateHiringRequest, deleteHiringRequest,
    resources, fetchResources
  } = useResourceStore();

  const [activeTab, setActiveTab] = useState('hiring'); // 'hiring' | 'skills'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hiring Form States
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [targetDate, setTargetDate] = useState('');
  const [salaryBudget, setSalaryBudget] = useState(60000);
  const [remarks, setRemarks] = useState('');

  // Skill matrix proficiencies data
  const skillCategories = [
    'Unity Engine & Physics', 
    'C# Scripting & Architecture', 
    '3D Asset Modeling (Blender)', 
    'Shader Graph & Visuals', 
    'Networking (Photon Fusion)'
  ];

  // Helper to map resource index to proficiency level
  const getProficiency = (resName, skill) => {
    // Generate a deterministically realistic matrix
    const sum = resName.charCodeAt(0) + skill.charCodeAt(0);
    const mod = sum % 4;
    switch (mod) {
      case 0: return { level: 'Beginner', color: 'bg-slate-50 text-slate-500 border-slate-200' };
      case 1: return { level: 'Intermediate', color: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 2: return { level: 'Expert', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      default: return { level: 'Master', color: 'bg-purple-50 text-purple-600 border-purple-200' };
    }
  };

  useEffect(() => {
    fetchHiringRequests();
    fetchResources(currentRole);
  }, [currentRole]);

  const handleOpenAdd = () => {
    setRole('');
    setDepartment('Engineering');
    setPriority('Medium');
    setStatus('Open');
    setTargetDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setSalaryBudget(60000);
    setRemarks('');
    setIsModalOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const payload = {
      role,
      department,
      priority,
      status,
      targetDate,
      salaryBudget: Number(salaryBudget),
      remarks
    };
    addHiringRequest(payload);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (req) => {
    const nextStatusMap = {
      'Open': 'Sourcing',
      'Sourcing': 'Interviewing',
      'Interviewing': 'Offer Extended',
      'Offer Extended': 'Filled',
      'Filled': 'Open'
    };
    const nextStatus = nextStatusMap[req.status] || 'Open';
    updateHiringRequest({ ...req, status: nextStatus });
  };

  const isEditable = canEditResources(currentRole);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Talent & Skills</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage hiring pipelines and audit the team's technical skill competencies.
          </p>
        </div>
        {activeTab === 'hiring' && isEditable && (
          <Button variant="primary" onClick={handleOpenAdd} icon={Plus}>
            Create Job Request
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('hiring')}
          className={`flex items-center gap-2 pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'hiring' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Briefcase size={16} />
          Hiring Pipeline ({hiringRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 pb-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'skills' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap size={16} />
          Skill Matrix
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'hiring' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hiringRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between h-52 group relative"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{req.department}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{req.role}</h3>
                  </div>
                  <Badge value={req.status} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {req.remarks || 'No detailed requirements submitted.'}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between mt-4">
                <div className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold space-y-1">
                  <div>Target Start: {formatDate(req.targetDate)}</div>
                  {currentRole === 'Admin' && (
                    <div className="text-blue-600 dark:text-blue-400">Budget: ₹{(req.salaryBudget || 0).toLocaleString()}/yr</div>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditable && (
                    <>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleToggleStatus(req)}
                      >
                        Advance Pipeline
                      </Button>
                      <button
                        onClick={() => deleteHiringRequest(req.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-opacity"
                        title="Delete request"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Skill Matrix Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                  <th className="px-6 py-4">Resource</th>
                  {skillCategories.map(cat => (
                    <th key={cat} className="px-4 py-4 text-center max-w-[150px] leading-tight">{cat}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-white">
                      {res.name}
                      <span className="text-[10px] text-slate-400 block font-normal">{res.role}</span>
                    </td>
                    {skillCategories.map(cat => {
                      const prof = getProficiency(res.name, cat);
                      return (
                        <td key={cat} className="px-4 py-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${prof.color}`}>
                            {prof.level}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job Request Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Job Hiring Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleAddSubmit}>Create Request</Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Target Role Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Unity Developer (Spatial Audio Specialist)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Art & Design">Art & Design</option>
                <option value="QA & Testing">QA & Testing</option>
                <option value="Product Management">Product Management</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Target Start Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Salary Budget (₹ / yr)</label>
              <input
                type="number"
                required
                value={salaryBudget}
                onChange={(e) => setSalaryBudget(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Key Requirements / Remarks</label>
            <textarea
              required
              placeholder="e.g. Must have 3+ years Unity scripting, experience with Oculus/Quest SDKs, Photon Fusion multiplayer sync..."
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
