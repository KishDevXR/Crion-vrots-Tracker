import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Table, 
  Info,
  Layers,
  ArrowRight,
  ClipboardPaste
} from 'lucide-react';

const FIELD_DEFS = [
  { key: 'projectName', label: 'Project Name / Column', aliases: ['project/module', 'project', 'project/module name', 'module', 'project_name'] },
  { key: 'description', label: 'Task Description', aliases: ['task planned/description', 'task description', 'description', 'task name', 'task', 'summary'] },
  { key: 'resourceName', label: 'Assignee Name', aliases: ['resource name', 'resource', 'assignee', 'user', 'allocated to', 'resource_name'] },
  { key: 'role', label: 'Role', aliases: ['role', 'designation', 'resource role'] },
  { key: 'plannedHours', label: 'Planned Hours', aliases: ['planned hour', 'planned hours', 'effort', 'hours', 'planned_hours'] },
  { key: 'actualHours', label: 'Actual Hours', aliases: ['actual hours', 'actual hour', 'actual_hours'] },
  { key: 'startDate', label: 'Start Date', aliases: ['start date', 'start_date', 'start'] },
  { key: 'endDate', label: 'End Date', aliases: ['end date', 'end_date', 'end'] },
  { key: 'status', label: 'Status', aliases: ['status', 'state', 'task status'] },
  { key: 'remarks', label: 'Remarks', aliases: ['remarks', 'remark', 'notes', 'comment'] },
  { key: 'weekNo', label: 'Week No', aliases: ['week no', 'week_no', 'week'] },
  { key: 'weekStartDate', label: 'Week Start Date', aliases: ['week start', 'week_start', 'week start date'] }
];

export default function SpreadsheetImportModal({ isOpen, onClose, onImport, projects, resources }) {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'upload'
  const [pasteText, setPasteText] = useState('');
  const [importStep, setImportStep] = useState(1); // 1: input, 2: mapping, 3: preview
  const [loading, setLoading] = useState(false);

  // Parsing results
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [parsedTasks, setParsedTasks] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  const fileInputRef = useRef(null);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setPasteText('');
      setImportStep(1);
      setHeaders([]);
      setRawRows([]);
      setColumnMapping({});
      setParsedTasks([]);
      setValidationErrors([]);
    }
  }, [isOpen]);

  // Parse TSV/CSV string
  const processRawData = (text, delimiter) => {
    if (!text.trim()) return;
    
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return;

    // Detect delimiter if not passed
    let delim = delimiter;
    if (!delim) {
      const firstLine = lines[0];
      const tabs = (firstLine.match(/\t/g) || []).length;
      const commas = (firstLine.match(/,/g) || []).length;
      delim = tabs >= commas ? '\t' : ',';
    }

    // Split headers
    const parsedHeaders = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Split rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      let values = [];
      if (delim === ',') {
        // Standard CSV quotes support
        let insideQuote = false;
        let currentValue = '';
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
      } else {
        // TSV
        values = line.split('\t').map(v => v.trim());
      }

      // Map header index to values
      const row = {};
      parsedHeaders.forEach((header, index) => {
        row[header] = values[index] !== undefined ? values[index].replace(/^"|"$/g, '') : '';
      });
      rows.push(row);
    }

    setHeaders(parsedHeaders);
    setRawRows(rows);

    // Auto detect column mapping
    const mapping = {};
    FIELD_DEFS.forEach(field => {
      const matchedHeader = parsedHeaders.find(h => {
        const cleaned = h.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        return field.aliases.some(alias => cleaned.includes(alias.toLowerCase()) || alias.toLowerCase() === cleaned);
      });
      if (matchedHeader) {
        mapping[field.key] = matchedHeader;
      } else {
        mapping[field.key] = '';
      }
    });
    setColumnMapping(mapping);
    setImportStep(2);
  };

  const handlePasteSubmit = () => {
    processRawData(pasteText);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const delimiter = file.name.endsWith('.tsv') ? '\t' : (file.name.endsWith('.csv') ? ',' : null);
      processRawData(text, delimiter);
    };
    reader.readAsText(file);
  };

  // Run validation and build tasks to import
  const runValidation = () => {
    const tasks = [];
    const errors = [];

    rawRows.forEach((row, idx) => {
      const task = {};
      FIELD_DEFS.forEach(field => {
        const headerName = columnMapping[field.key];
        task[field.key] = headerName ? row[headerName] : '';
      });

      // Special handling: split Project/Module
      let pName = task.projectName || '';
      let mName = null;
      if (pName.includes(' - ')) {
        const parts = pName.split(' - ');
        pName = parts[0].trim();
        mName = parts.slice(1).join(' - ').trim();
      } else if (pName.includes('/')) {
        const parts = pName.split('/');
        pName = parts[0].trim();
        mName = parts.slice(1).join('/').trim();
      }

      task.projectName = pName;
      task.moduleName = mName;

      // Validate description is required
      if (!task.description || !task.description.trim()) {
        errors.push(`Row ${idx + 2}: Task Description is missing.`);
      }

      tasks.push(task);
    });

    setParsedTasks(tasks);
    setValidationErrors(errors);
    setImportStep(3);
  };

  const handleConfirmImport = async () => {
    if (parsedTasks.length === 0) return;
    setLoading(true);
    try {
      await onImport(parsedTasks);
      onClose();
    } catch (e) {
      alert('Error importing tasks: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const projectMap = new Set(projects.map(p => p.name.toLowerCase().trim()));
  const resourceMap = new Set(resources.map(r => r.name.toLowerCase().trim()));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-blue-500" size={20} />
          <span>Import Tasks Spreadsheet</span>
        </div>
      }
      size={importStep === 3 ? "xl" : "lg"}
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {importStep > 1 && (
              <Button variant="secondary" onClick={() => setImportStep(importStep - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            {importStep === 1 && (
              <Button 
                variant="primary" 
                onClick={handlePasteSubmit} 
                disabled={activeTab === 'paste' ? !pasteText.trim() : true}
              >
                Continue
              </Button>
            )}
            {importStep === 2 && (
              <Button variant="primary" onClick={runValidation}>
                Map and Preview
              </Button>
            )}
            {importStep === 3 && (
              <Button 
                variant="primary" 
                onClick={handleConfirmImport} 
                loading={loading}
                disabled={parsedTasks.length === 0}
              >
                Import {parsedTasks.length} Tasks
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* STEP 1: LOAD SOURCE DATA */}
      {importStep === 1 && (
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'paste' 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardPaste size={15} />
              Paste from Google Sheets / Excel
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload' 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UploadCloud size={15} />
              Upload CSV/TSV File
            </button>
          </div>

          {activeTab === 'paste' ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Paste Spreadsheet Data (with headers)
              </label>
              <textarea
                placeholder="Copy columns from your sheet (including headers) and paste here. E.g.
Week Start	Week No	Resource Name	Project/Module	Task Planned/Description	Planned Hour...
29-Jun-2026	2026-W27	Hemanth	ABB - BF	Build Fix	4..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={12}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:text-white"
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info size={12} />
                Copying a table from Google Sheets or Excel formats automatically as Tab-Separated Values (TSV).
              </p>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center space-y-3"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv,.tsv,.txt"
                className="hidden" 
              />
              <UploadCloud className="text-slate-400 dark:text-slate-655" size={40} />
              <div>
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Click to upload</span> or drag and drop
                <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Supports CSV, TSV (tab separated)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {importStep === 2 && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 flex gap-2.5">
            <Info size={16} className="shrink-0 text-blue-500" />
            <div>
              <p className="font-bold">Match columns to fields</p>
              <p className="mt-0.5">Confirm or assign which columns in your spreadsheet map to the respective fields in VROTS Tracker.</p>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 border border-slate-100 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-850">
            {FIELD_DEFS.map(field => (
              <div key={field.key} className="flex items-center justify-between p-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {field.label}
                    {field.key === 'description' && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  <span className="text-xs text-slate-450 dark:text-slate-500">
                    {field.key === 'projectName' ? 'Automatically splits Project - Module' : `Maps to task ${field.key}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight size={14} className="text-slate-350" />
                  <select
                    value={columnMapping[field.key] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300 font-medium min-w-[180px]"
                  >
                    <option value="">-- Skip Field --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & IMPORT */}
      {importStep === 3 && (
        <div className="space-y-4">
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle size={15} />
                <span>Found {validationErrors.length} validation errors:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 font-mono max-h-[100px] overflow-y-auto">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Table size={15} className="text-blue-500" />
              Import Preview (Showing first 10 items)
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">
              Total {parsedTasks.length} tasks ready to import
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Project/Module</th>
                    <th className="px-4 py-2.5">Task Description</th>
                    <th className="px-4 py-2.5">Assignee</th>
                    <th className="px-4 py-2.5">Hours</th>
                    <th className="px-4 py-2.5">Dates</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {parsedTasks.slice(0, 10).map((t, i) => {
                    const projectExists = projectMap.has((t.projectName || '').toLowerCase().trim());
                    const resourceExists = resourceMap.has((t.resourceName || '').toLowerCase().trim());

                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-2.5 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">{t.projectName || 'General'}</span>
                            {!projectExists && t.projectName && (
                              <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1 py-0.2 rounded font-bold uppercase">
                                New Project
                              </span>
                            )}
                          </div>
                          {t.moduleName && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Layers size={10} />
                              {t.moduleName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-350 max-w-[200px] truncate" title={t.description}>
                          {t.description}
                        </td>
                        <td className="px-4 py-2.5 space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white">{t.resourceName || 'Unassigned'}</div>
                          {t.resourceName && !resourceExists && (
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.2 rounded font-bold uppercase block w-max">
                              Text Resource
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-semibold font-mono text-slate-600 dark:text-slate-400">
                          {t.plannedHours || 0} hrs
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {t.startDate || 'No start'} → {t.endDate || 'No end'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'Done' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                            t.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            t.status === 'Blocked' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {t.status || 'Not Started'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
