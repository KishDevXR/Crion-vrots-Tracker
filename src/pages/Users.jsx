import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Key, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Users() {
  const { users, fetchUsers, addUser, updateUser, deleteUser, currentUser } = useAuthStore();
  
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Team Member');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('Team Member');
    setShowPassword(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setShowPassword(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = (uName, uFullName) => {
    if (uFullName === currentUser) {
      alert("You cannot delete the currently logged in user profile.");
      return;
    }
    if (confirm(`Are you sure you want to permanently delete user "${uFullName}" (${uName})?`)) {
      deleteUser(uName);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const uTrimmed = username.trim().toLowerCase();
    const nTrimmed = name.trim();
    const pTrimmed = password.trim();

    if (!uTrimmed || !nTrimmed || !pTrimmed) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (!editingUser) {
      // Check if username already exists
      const exists = users.some(u => u.username.toLowerCase() === uTrimmed);
      if (exists) {
        setErrorMsg("Username already exists. Please choose a different one.");
        return;
      }

      addUser({
        username: uTrimmed,
        name: nTrimmed,
        password: pTrimmed,
        role
      });
    } else {
      // Edit mode
      updateUser(editingUser.username, {
        name: nTrimmed,
        password: pTrimmed,
        role
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight flex items-center gap-2">
            <UsersIcon className="text-blue-600 dark:text-blue-500" />
            User Management Control Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administrate registered credentials, assign roles, configure access tokens, and enforce workspace policies.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} icon={UserPlus}>
          Add User
        </Button>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-150">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Username</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Secure Password Token</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {u.name}
                        {u.name === currentUser && (
                          <span className="ml-2 text-[9px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs">
                    {u.username}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5">
                      {u.role === 'Admin' && <ShieldCheck size={14} className="text-emerald-500" />}
                      <Badge value={u.role} />
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-55/60 dark:bg-slate-800/80 px-2.5 py-1 rounded border border-slate-200/40 dark:border-slate-700/50">
                      ●●●●●●●● ( {u.password} )
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Edit credentials & role"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.username, u.name)}
                        disabled={u.name === currentUser}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Delete user profile"
                      >
                        <Trash2 size={15} />
                      </button>
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
        title={editingUser ? "Edit User Account" : "Add User Account"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              {editingUser ? "Save User" : "Add User"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg border border-red-100 dark:border-red-900/50">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kishore Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              required
              disabled={!!editingUser}
              placeholder="e.g. kishore"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="e.g. password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Team Member">Team Member</option>
              <option value="Stakeholder">Stakeholder</option>
            </select>
          </div>
        </form>
      </Modal>

    </div>
  );
}
