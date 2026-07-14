import React, { useState, useEffect } from 'react';
import { useQAStore } from '../store/qaStore';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { canEditProjects } from '../utils/permissionUtils';
import { formatDate } from '../utils/dateUtils';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  Layers,
  Bug,
  GitPullRequest,
  Tag,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  User,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function QAHub() {
  const currentRole = useAuthStore((state) => state.currentRole);
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);

  const { projects, modules, fetchProjects, fetchModules } = useProjectStore();
  const {
    builds,
    bugs,
    changeRequests,
    fetchBuilds,
    addBuild,
    updateBuild,
    deleteBuild,
    fetchBugs,
    addBug,
    updateBug,
    deleteBug,
    fetchChangeRequests,
    addChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
  } = useQAStore();

  const [activeTab, setActiveTab] = useState('builds'); // builds | bugs | cr
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  // Modals state
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isCRModalOpen, setIsCRModalOpen] = useState(false);

  const [editingBuild, setEditingBuild] = useState(null);
  const [editingBug, setEditingBug] = useState(null);
  const [editingCR, setEditingCR] = useState(null);

  // Form states - Build
  const [buildProjId, setBuildProjId] = useState('');
  const [buildNo, setBuildNo] = useState('');
  const [buildReleaseDate, setBuildReleaseDate] = useState('');
  const [buildStatus, setBuildStatus] = useState('In Progress');
  const [buildRemarks, setBuildRemarks] = useState('');

  // Form states - Bug
  const [bugProjId, setBugProjId] = useState('');
  const [bugModId, setBugModId] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSeverity, setBugSeverity] = useState('Medium');
  const [bugStatus, setBugStatus] = useState('New');
  const [bugAssignee, setBugAssignee] = useState('');
  const [bugBuildFound, setBugBuildFound] = useState('');
  const [bugBuildFixed, setBugBuildFixed] = useState('');

  // Form states - CR
  const [crProjId, setCrProjId] = useState('');
  const [crTitle, setCrTitle] = useState('');
  const [crDesc, setCrDesc] = useState('');
  const [crStatus, setCrStatus] = useState('Proposed');
  const [crPriority, setCrPriority] = useState('Medium');
  const [crEffort, setCrEffort] = useState(0);
  const [crRequestedBy, setCrRequestedBy] = useState('');
  const [crTargetBuild, setCrTargetBuild] = useState('');

  useEffect(() => {
    fetchProjects(currentRole);
    fetchModules(currentRole);
    fetchBuilds();
    fetchBugs();
    fetchChangeRequests();
  }, [currentRole]);

  // Set default form values when project changes
  useEffect(() => {
    if (projects.length > 0) {
      if (!buildProjId) setBuildProjId(projects[0].id);
      if (!bugProjId) setBugProjId(projects[0].id);
      if (!crProjId) setCrProjId(projects[0].id);
    }
  }, [projects]);

  const canManageReleases = canEditProjects(currentRole);

  // Filter lists based on project select
  const filteredBuilds = builds.filter(b => selectedProjectId === 'all' || b.projectId === selectedProjectId);
  const filteredBugs = bugs.filter(b => selectedProjectId === 'all' || b.projectId === selectedProjectId);
  const filteredCRs = changeRequests.filter(c => selectedProjectId === 'all' || c.projectId === selectedProjectId);

  // BUILD Actions
  const handleOpenAddBuild = () => {
    setEditingBuild(null);
    setBuildProjId(projects[0]?.id || '');
    setBuildNo('');
    setBuildReleaseDate(new Date().toISOString().split('T')[0]);
    setBuildStatus('In Progress');
    setBuildRemarks('');
    setIsBuildModalOpen(true);
  };

  const handleOpenEditBuild = (build) => {
    setEditingBuild(build);
    setBuildProjId(build.projectId);
    setBuildNo(build.buildNo);
    setBuildReleaseDate(build.releaseDate || '');
    setBuildStatus(build.status);
    setBuildRemarks(build.remarks || '');
    setIsBuildModalOpen(true);
  };

  const handleSaveBuild = async (e) => {
    e.preventDefault();
    const payload = {
      projectId: buildProjId,
      buildNo,
      releaseDate: buildReleaseDate || null,
      status: buildStatus,
      remarks: buildRemarks,
    };
    if (editingBuild) {
      await updateBuild({ id: editingBuild.id, ...payload });
    } else {
      await addBuild(payload);
    }
    setIsBuildModalOpen(false);
  };

  const handleDeleteBuild = async (id) => {
    if (confirm('Are you sure you want to delete this build?')) {
      await deleteBuild(id);
    }
  };

  // BUG Actions
  const handleOpenAddBug = () => {
    setEditingBug(null);
    setBugProjId(projects[0]?.id || '');
    setBugModId('');
    setBugTitle('');
    setBugDesc('');
    setBugSeverity('Medium');
    setBugStatus('New');
    setBugAssignee('');
    setBugBuildFound('');
    setBugBuildFixed('');
    setIsBugModalOpen(true);
  };

  const handleOpenEditBug = (bug) => {
    setEditingBug(bug);
    setBugProjId(bug.projectId);
    setBugModId(bug.moduleId || '');
    setBugTitle(bug.title);
    setBugDesc(bug.description || '');
    setBugSeverity(bug.severity);
    setBugStatus(bug.status);
    setBugAssignee(bug.assignedTo || '');
    setBugBuildFound(bug.buildFoundId || '');
    setBugBuildFixed(bug.buildFixedId || '');
    setIsBugModalOpen(true);
  };

  const handleSaveBug = async (e) => {
    e.preventDefault();
    const payload = {
      projectId: bugProjId,
      moduleId: bugModId || null,
      title: bugTitle,
      description: bugDesc,
      severity: bugSeverity,
      status: bugStatus,
      assignedTo: bugAssignee || null,
      buildFoundId: bugBuildFound || null,
      buildFixedId: bugBuildFixed || null,
      createdBy: editingBug ? editingBug.createdBy : currentUser,
    };
    if (editingBug) {
      await updateBug({ id: editingBug.id, ...payload });
    } else {
      await addBug(payload);
    }
    setIsBugModalOpen(false);
  };

  const handleDeleteBug = async (id) => {
    if (confirm('Are you sure you want to delete this bug log?')) {
      await deleteBug(id);
    }
  };

  // CR Actions
  const handleOpenAddCR = () => {
    setEditingCR(null);
    setCrProjId(projects[0]?.id || '');
    setCrTitle('');
    setCrDesc('');
    setCrStatus('Proposed');
    setCrPriority('Medium');
    setCrEffort(0);
    setCrRequestedBy('');
    setCrTargetBuild('');
    setIsCRModalOpen(true);
  };

  const handleOpenEditCR = (cr) => {
    setEditingCR(cr);
    setCrProjId(cr.projectId);
    setCrTitle(cr.title);
    setCrDesc(cr.description || '');
    setCrStatus(cr.status);
    setCrPriority(cr.priority);
    setCrEffort(cr.effortHours);
    setCrRequestedBy(cr.requestedBy || '');
    setCrTargetBuild(cr.targetBuildId || '');
    setIsCRModalOpen(true);
  };

  const handleSaveCR = async (e) => {
    e.preventDefault();
    const payload = {
      projectId: crProjId,
      title: crTitle,
      description: bugDesc, // Using matching content
      status: crStatus,
      priority: crPriority,
      effortHours: parseFloat(crEffort) || 0,
      requestedBy: crRequestedBy,
      targetBuildId: crTargetBuild || null,
    };
    if (editingCR) {
      await updateCR({ id: editingCR.id, ...payload });
    } else {
      await addChangeRequest(payload);
    }
    setIsCRModalOpen(false);
  };

  const updateCR = async (payload) => {
    await updateChangeRequest(payload);
  };

  const handleDeleteCR = async (id) => {
    if (confirm('Are you sure you want to delete this change request?')) {
      await deleteChangeRequest(id);
    }
  };

  // Helper maps for displaying relations
  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const moduleMap = new Map(modules.map(m => [m.id, m.name]));
  const userMap = new Map(users.map(u => [u.id, u.name]));
  const buildMap = new Map(builds.map(b => [b.id, b.buildNo]));

  // Severity style badges
  const getSeverityBadge = (sev) => {
    const styles = {
      Low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      Medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      High: 'bg-orange-100 text-orange-850 dark:bg-orange-950/30 dark:text-orange-400',
      Critical: 'bg-red-150 text-red-900 dark:bg-red-950/40 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-900/50'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[sev] || styles.Medium}`}>{sev}</span>;
  };

  // Status style badges for Bugs & CRs
  const getQAStatusBadge = (status, type) => {
    let classes = 'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300';
    if (type === 'bug') {
      const bugColors = {
        New: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
        'In Progress': 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
        'Ready to Test': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-105 dark:border-indigo-900/30',
        Verified: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30',
        Closed: 'bg-slate-100 text-slate-650 dark:bg-slate-850 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
      };
      classes = bugColors[status] || classes;
    } else if (type === 'cr') {
      const crColors = {
        Proposed: 'bg-slate-50 text-slate-700 dark:bg-slate-850 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
        Approved: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
        'In Progress': 'bg-amber-50 text-amber-750 dark:bg-amber-950/30 dark:text-amber-405 border border-amber-100 dark:border-amber-900/30',
        Implemented: 'bg-emerald-50 text-emerald-705 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30',
        Rejected: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30',
      };
      classes = crColors[status] || classes;
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${classes}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bug className="text-blue-500" />
            QA & Release Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage product build releases, bug tracking, and client change requests.
          </p>
        </div>

        {/* Top level Project Filter */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Layers size={16} className="text-slate-400 shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56 transition-colors shadow-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-850">
        <button
          onClick={() => setActiveTab('builds')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'builds'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Tag size={16} />
          Builds & Releases ({filteredBuilds.length})
        </button>
        <button
          onClick={() => setActiveTab('bugs')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'bugs'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bug size={16} />
          Bug Log ({filteredBugs.length})
        </button>
        <button
          onClick={() => setActiveTab('cr')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'cr'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GitPullRequest size={16} />
          Change Requests ({filteredCRs.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 overflow-hidden transition-all">
        
        {/* BUILDS TAB */}
        {activeTab === 'builds' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Product Builds</h3>
              {canManageReleases && (
                <Button onClick={handleOpenAddBuild} icon={Plus} size="sm">
                  Add Build
                </Button>
              )}
            </div>

            {filteredBuilds.length === 0 ? (
              <div className="text-center py-16 text-slate-450 italic">
                No build records found for the selected project.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold text-xs tracking-wider">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Build / Version</th>
                      <th className="py-3 px-4">Release Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                      {canManageReleases && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuilds.map((b) => (
                      <tr key={b.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          {projectMap.get(b.projectId) || 'Unknown Project'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {b.buildNo}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {b.releaseDate ? formatDate(b.releaseDate) : 'Not Scheduled'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge value={b.status} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {b.remarks || '-'}
                        </td>
                        {canManageReleases && (
                          <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditBuild(b)}
                              className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all inline-flex"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteBuild(b.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all inline-flex"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BUGS TAB */}
        {activeTab === 'bugs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bug Tracking Log</h3>
              <Button onClick={handleOpenAddBug} icon={Plus} size="sm">
                Report Bug
              </Button>
            </div>

            {filteredBugs.length === 0 ? (
              <div className="text-center py-16 text-slate-450 italic">
                No bugs logged for the selected project. Good job!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold text-xs tracking-wider">
                      <th className="py-3 px-4">Project / Module</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Found / Fixed Build</th>
                      <th className="py-3 px-4">Logged By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBugs.map((bug) => (
                      <tr key={bug.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium">
                          <span className="text-slate-900 dark:text-white block">
                            {projectMap.get(bug.projectId) || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-550 block mt-0.5">
                            {moduleMap.get(bug.moduleId) || 'Core Module'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{bug.title}</span>
                          <span className="text-xs text-slate-450 block truncate max-w-xs">{bug.description}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getSeverityBadge(bug.severity)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getQAStatusBadge(bug.status, 'bug')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {bug.assignedTo ? (
                            <span className="flex items-center gap-1">
                              <User size={12} className="text-slate-400" />
                              {userMap.get(bug.assignedTo) || 'Assigned User'}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-550 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {bug.buildFoundId ? (
                            <span className="text-orange-500 font-semibold">{buildMap.get(bug.buildFoundId)}</span>
                          ) : (
                            '-'
                          )}
                          {bug.buildFixedId && (
                            <span className="text-emerald-500 font-semibold"> → {buildMap.get(bug.buildFixedId)}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {bug.createdBy || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditBug(bug)}
                            className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all inline-flex"
                          >
                            <Edit3 size={14} />
                          </button>
                          {canManageReleases && (
                            <button
                              onClick={() => handleDeleteBug(bug.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all inline-flex"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CHANGE REQUESTS TAB */}
        {activeTab === 'cr' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Request (CR) Register</h3>
              {canManageReleases && (
                <Button onClick={handleOpenAddCR} icon={Plus} size="sm">
                  Create CR
                </Button>
              )}
            </div>

            {filteredCRs.length === 0 ? (
              <div className="text-center py-16 text-slate-455 italic">
                No change requests found for this project selection.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold text-xs tracking-wider">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Estimated Effort</th>
                      <th className="py-3 px-4">Target Release</th>
                      <th className="py-3 px-4">Requested By</th>
                      {canManageReleases && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCRs.map((cr) => (
                      <tr key={cr.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          {projectMap.get(cr.projectId) || 'Unknown Project'}
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{cr.title}</span>
                          <span className="text-xs text-slate-450 block truncate max-w-xs">{cr.description}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getQAStatusBadge(cr.status, 'cr')}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge type="priority" value={cr.priority} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {cr.effortHours} hrs
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-blue-600 dark:text-blue-450">
                          {cr.targetBuildId ? buildMap.get(cr.targetBuildId) : 'TBD'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {cr.requestedBy || '-'}
                        </td>
                        {canManageReleases && (
                          <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditCR(cr)}
                              className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all inline-flex"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCR(cr.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all inline-flex"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* BUILD MODAL                                */}
      {/* ========================================== */}
      <Modal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
        title={editingBuild ? 'Edit Product Build' : 'Create New Build'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setIsBuildModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="buildForm">
              {editingBuild ? 'Save Build' : 'Create Build'}
            </Button>
          </div>
        }
      >
        <form id="buildForm" onSubmit={handleSaveBuild} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Project</label>
            <select
              value={buildProjId}
              onChange={(e) => setBuildProjId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              required
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Build No / Version</label>
            <input
              type="text"
              value={buildNo}
              onChange={(e) => setBuildNo(e.target.value)}
              placeholder="e.g. v1.0.0, Build 42"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Release Date</label>
            <input
              type="date"
              value={buildReleaseDate}
              onChange={(e) => setBuildReleaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
            <select
              value={buildStatus}
              onChange={(e) => setBuildStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            >
              <option value="In Progress">In Progress</option>
              <option value="Testing">Testing</option>
              <option value="Released">Released</option>
              <option value="Aborted">Aborted</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Remarks</label>
            <textarea
              value={buildRemarks}
              onChange={(e) => setBuildRemarks(e.target.value)}
              rows={3}
              placeholder="Notes on scope, release notes, etc."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* BUG MODAL                                  */}
      {/* ========================================== */}
      <Modal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        title={editingBug ? 'Edit Bug Log' : 'Report Product Bug'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setIsBugModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="bugForm">
              {editingBug ? 'Save Bug' : 'Report Bug'}
            </Button>
          </div>
        }
      >
        <form id="bugForm" onSubmit={handleSaveBug} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Project</label>
              <select
                value={bugProjId}
                onChange={(e) => setBugProjId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
                required
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Module</label>
              <select
                value={bugModId}
                onChange={(e) => setBugModId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="">Core / Generic</option>
                {modules.filter(m => m.projectId === bugProjId).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Bug Title / Summary</label>
            <input
              type="text"
              value={bugTitle}
              onChange={(e) => setBugTitle(e.target.value)}
              placeholder="e.g. Login button unresponsive on mobile view"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Detailed Steps to Reproduce</label>
            <textarea
              value={bugDesc}
              onChange={(e) => setBugDesc(e.target.value)}
              rows={3}
              placeholder="Describe what goes wrong and how to reproduce it..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Severity</label>
              <select
                value={bugSeverity}
                onChange={(e) => setBugSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={bugStatus}
                onChange={(e) => setBugStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready to Test">Ready to Test</option>
                <option value="Verified">Verified</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Assignee</label>
            <select
              value={bugAssignee}
              onChange={(e) => setBugAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Build Found In</label>
              <select
                value={bugBuildFound}
                onChange={(e) => setBugBuildFound(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-mono"
              >
                <option value="">Unknown / None</option>
                {builds.filter(b => b.projectId === bugProjId).map(b => (
                  <option key={b.id} value={b.id}>{b.buildNo}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Build Fixed In</label>
              <select
                value={bugBuildFixed}
                onChange={(e) => setBugBuildFixed(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-mono"
              >
                <option value="">Not Fixed Yet</option>
                {builds.filter(b => b.projectId === bugProjId).map(b => (
                  <option key={b.id} value={b.id}>{b.buildNo}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* CR MODAL                                   */}
      {/* ========================================== */}
      <Modal
        isOpen={isCRModalOpen}
        onClose={() => setIsCRModalOpen(false)}
        title={editingCR ? 'Edit Change Request' : 'Create Change Request'}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setIsCRModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="crForm">
              {editingCR ? 'Save Changes' : 'Create CR'}
            </Button>
          </div>
        }
      >
        <form id="crForm" onSubmit={handleSaveCR} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Project</label>
            <select
              value={crProjId}
              onChange={(e) => setCrProjId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              required
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">CR Title / Summary</label>
            <input
              type="text"
              value={crTitle}
              onChange={(e) => setCrTitle(e.target.value)}
              placeholder="e.g. Integrate Apple Pay as a payment option"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Scope Details</label>
            <textarea
              value={crDesc}
              onChange={(e) => setCrDesc(e.target.value)}
              rows={3}
              placeholder="Details on what features are requested..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={crStatus}
                onChange={(e) => setCrStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="Proposed">Proposed</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Implemented">Implemented</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={crPriority}
                onChange={(e) => setCrPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Effort Hours</label>
              <input
                type="number"
                value={crEffort}
                onChange={(e) => setCrEffort(e.target.value)}
                placeholder="e.g. 24"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
                min="0"
                step="0.5"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Requested By</label>
              <input
                type="text"
                value={crRequestedBy}
                onChange={(e) => setCrRequestedBy(e.target.value)}
                placeholder="e.g. Client name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Target Build / Release</label>
            <select
              value={crTargetBuild}
              onChange={(e) => setCrTargetBuild(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-mono"
            >
              <option value="">TBD / Backlog</option>
              {builds.filter(b => b.projectId === crProjId).map(b => (
                <option key={b.id} value={b.id}>{b.buildNo}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
