/* 
 * Simple Google Sheets Sync via Apps Script Web App
 * 
 * Instead of complex OAuth + Cloud Console setup, we use a Google Apps Script
 * deployed as a web app. The user just:
 * 1. Creates a Google Sheet
 * 2. Pastes our script into Extensions > Apps Script
 * 3. Deploys as Web App
 * 4. Pastes the URL here
 */

const STORAGE_KEY = 'taskmanager_apps_script_url';
const SHEET_URL_KEY = 'taskmanager_sheet_url';

// Get/set the Apps Script Web App URL
export const getScriptUrl = () => localStorage.getItem(STORAGE_KEY) || '';
export const setScriptUrl = (url) => localStorage.setItem(STORAGE_KEY, url);
export const clearScriptUrl = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SHEET_URL_KEY);
};

// Get/set the Google Sheet URL (for "Open in Sheets" link)
export const getSheetUrl = () => localStorage.getItem(SHEET_URL_KEY) || '';
export const setSheetUrl = (url) => localStorage.setItem(SHEET_URL_KEY, url);

export const isConnected = () => !!getScriptUrl();

// Convert task object to a plain object for the script
const taskToRow = (task) => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    category: task.category,
    priority: task.priority,
    deadline: task.deadline || '',
    status: task.status,
    createdDate: task.createdDate,
    completedDate: task.completedDate || '',
    timeSpent: task.timeSpent || 0,
    recurring: task.recurring || 'none',
    modifiedDate: task.modifiedDate || task.createdDate || '',
});

// Convert row from script back to task object
const rowToTask = (row) => ({
    id: row.id || '',
    title: row.title || '',
    description: row.description || '',
    category: row.category || 'Other',
    priority: row.priority || 'Medium',
    deadline: row.deadline || null,
    status: row.status || 'pending',
    createdDate: row.createdDate || new Date().toISOString(),
    completedDate: row.completedDate || null,
    timeSpent: parseInt(row.timeSpent) || 0,
    recurring: row.recurring || 'none',
    timeEstimate: row.timeEstimate || 0,
    tags: row.tags || [],
    modifiedDate: row.modifiedDate || row.createdDate || '',
});

// Test connection to the Apps Script
export const testConnection = async () => {
    const url = getScriptUrl();
    if (!url) throw new Error('No Apps Script URL configured');

    try {
        const response = await fetch(`${url}?action=ping`, {
            method: 'GET',
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'ok') {
            // Save the sheet URL if provided
            if (data.sheetUrl) {
                setSheetUrl(data.sheetUrl);
            }
            return { success: true, sheetUrl: data.sheetUrl };
        }
        throw new Error(data.error || 'Unknown error');
    } catch (e) {
        if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
            throw new Error('Cannot reach the script. Make sure the URL is correct and deployed as "Anyone".');
        }
        throw e;
    }
};

// Fetch all tasks from the Google Sheet
export const fetchTasks = async () => {
    const url = getScriptUrl();
    if (!url) return null;

    try {
        const response = await fetch(`${url}?action=getTasks`, {
            method: 'GET',
            redirect: 'follow',
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.status === 'ok' && Array.isArray(data.tasks)) {
            return data.tasks.map(rowToTask);
        }
        return null;
    } catch (e) {
        console.error('Failed to fetch tasks from sheet:', e);
        return null;
    }
};

// Sync all tasks to the Google Sheet (full overwrite)
export const syncTasks = async (tasks) => {
    const url = getScriptUrl();
    if (!url) return false;

    try {
        const payload = {
            action: 'syncTasks',
            tasks: tasks.map(taskToRow),
        };

        const response = await fetch(url, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return data.status === 'ok';
    } catch (e) {
        console.error('Failed to sync tasks to sheet:', e);
        return false;
    }
};

// Export report to a new sheet tab
export const exportReport = async (reportData, title) => {
    const url = getScriptUrl();
    if (!url) return false;

    try {
        const payload = {
            action: 'exportReport',
            title,
            data: reportData,
        };

        const response = await fetch(url, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.status === 'ok';
    } catch (e) {
        console.error('Failed to export report:', e);
        return false;
    }
};

// The Google Apps Script code that users paste into their sheet
export const APPS_SCRIPT_CODE = `// ============================================
// TaskFlow - Google Sheets Sync Script
// Paste this in Extensions > Apps Script
// Then Deploy > New Deployment > Web App
// Set: Execute as "Me", Access "Anyone"
// ============================================

const SHEET_NAME = 'Tasks';
const HEADERS = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Deadline', 'Status', 'Created Date', 'Completed Date', 'Time Spent', 'Recurring', 'Modified Date'];

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'ping') {
    return jsonResponse({ 
      status: 'ok', 
      message: 'Connected!',
      sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });
  }
  
  if (action === 'getTasks') {
    return jsonResponse(getTasks());
  }
  
  return jsonResponse({ status: 'error', error: 'Unknown action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'syncTasks') {
      return jsonResponse(syncTasks(data.tasks));
    }
    
    if (data.action === 'exportReport') {
      return jsonResponse(exportReport(data.title, data.data));
    }
    
    return jsonResponse({ status: 'error', error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.message });
  }
}

function getTasks() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'ok', tasks: [] };
  
  const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const tasks = data
    .filter(row => row[0]) // skip empty rows
    .map(row => ({
      id: row[0],
      title: row[1],
      description: row[2],
      category: row[3],
      priority: row[4],
      deadline: row[5] ? new Date(row[5]).toISOString() : '',
      status: row[6],
      createdDate: row[7] ? new Date(row[7]).toISOString() : '',
      completedDate: row[8] ? new Date(row[8]).toISOString() : '',
      timeSpent: Number(row[9]) || 0,
      recurring: row[10] || 'none',
      modifiedDate: row[11] ? new Date(row[11]).toISOString() : '',
    }));
  
  return { status: 'ok', tasks: tasks };
}

function syncTasks(tasks) {
  const sheet = getOrCreateSheet();
  
  // Clear existing data (keep headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
  }
  
  if (!tasks || tasks.length === 0) {
    return { status: 'ok', count: 0 };
  }
  
  // Write all tasks
  const rows = tasks.map(t => [
    t.id, t.title, t.description, t.category, t.priority,
    t.deadline, t.status, t.createdDate, t.completedDate,
    t.timeSpent, t.recurring, t.modifiedDate
  ]);
  
  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  
  return { status: 'ok', count: rows.length };
}

function exportReport(title, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportSheet;
  
  try {
    reportSheet = ss.insertSheet(title);
  } catch (e) {
    // Sheet exists, overwrite
    reportSheet = ss.getSheetByName(title);
    if (reportSheet) reportSheet.clear();
    else reportSheet = ss.insertSheet(title + ' ' + new Date().getTime());
  }
  
  if (data && data.length > 0) {
    reportSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
  
  return { status: 'ok' };
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#6C63FF');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;
