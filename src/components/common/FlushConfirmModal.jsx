import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function FlushConfirmModal({ isOpen, onClose, onConfirm }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin !== '9999') {
      setError('Invalid Security PIN. Access Denied.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Flush operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <ShieldAlert size={22} className="animate-pulse" />
          <span>Wipe Tracker Database</span>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSubmit} 
            loading={loading}
            disabled={pin !== '9999'}
          >
            Permanently Delete Everything
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="text-xs text-red-800 dark:text-red-300 space-y-1.5 leading-relaxed">
            <p className="font-bold uppercase tracking-wider">Crucial Security Alert</p>
            <p>
              You are about to permanently delete **all Projects, Modules, Sprints, Epics, Tasks, Deliverables, Time Logs, and Activity Logs** in this tracker.
            </p>
            <p className="font-bold">This operation is destructive and cannot be undone.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Enter Admin Security PIN (9999) to authorize:
          </label>
          <input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError('');
            }}
            maxLength={4}
            className="w-full text-center tracking-[1em] text-lg font-mono bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            autoFocus
          />
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-500 dark:text-red-400 text-center animate-shake">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
