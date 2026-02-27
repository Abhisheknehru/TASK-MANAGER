/* Google Sheets API Service */
import { getAccessToken } from './googleAuth';

const SHEET_NAME = 'Tasks';
const HEADERS = ['Task ID', 'Title', 'Description', 'Category', 'Priority', 'Deadline', 'Status', 'Created Date', 'Completed Date', 'Time Spent', 'Recurring', 'Modified Date'];

const getSheetId = () => localStorage.getItem('taskmanager_sheet_id');
const setSheetId = (id) => localStorage.setItem('taskmanager_sheet_id', id ? JSON.stringify(id) : null);

// Get the URL to the user's spreadsheet
export const getSpreadsheetUrl = () => {
    const sheetId = getSheetId();
    if (!sheetId) return null;
    try {
        const id = JSON.parse(sheetId);
        return `https://docs.google.com/spreadsheets/d/${id}`;
    } catch {
        return null;
    }
};

// Test the connection by listing spreadsheets
export const testConnection = async () => {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');
    try {
        await window.gapi.client.drive.files.list({ pageSize: 1, q: "mimeType='application/vnd.google-apps.spreadsheet'" });
        return true;
    } catch (e) {
        throw new Error('Connection test failed: ' + (e.message || 'Unknown error'));
    }
};

// Create a new spreadsheet
export const createSpreadsheet = async () => {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await window.gapi.client.sheets.spreadsheets.create({
        properties: { title: 'TaskManager Data' },
        sheets: [{
            properties: { title: SHEET_NAME },
            data: [{
                startRow: 0,
                startColumn: 0,
                rowData: [{
                    values: HEADERS.map(h => ({ userEnteredValue: { stringValue: h } }))
                }]
            }]
        }]
    });

    const spreadsheetId = response.result.spreadsheetId;
    setSheetId(spreadsheetId);

    // Format header row
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requests: [{
            repeatCell: {
                range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.42, green: 0.39, blue: 1 },
                        textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
                        horizontalAlignment: 'CENTER'
                    }
                },
                fields: 'userEnteredFormat'
            }
        }, {
            updateSheetProperties: {
                properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
                fields: 'gridProperties.frozenRowCount'
            }
        }]
    });

    return spreadsheetId;
};

// Convert task object to sheet row
const taskToRow = (task) => [
    task.id,
    task.title,
    task.description || '',
    task.category,
    task.priority,
    task.deadline || '',
    task.status,
    task.createdDate,
    task.completedDate || '',
    String(task.timeSpent || 0),
    task.recurring || 'none',
    task.modifiedDate || task.createdDate || '',
];

// Convert sheet row to task object
const rowToTask = (row) => {
    if (!row || row.length < 2) return null;
    const createdDate = row[7] || new Date().toISOString();
    return {
        id: row[0] || '',
        title: row[1] || '',
        description: row[2] || '',
        category: row[3] || 'Other',
        priority: row[4] || 'Medium',
        deadline: row[5] || null,
        status: row[6] || 'pending',
        createdDate,
        completedDate: row[8] || null,
        timeSpent: parseInt(row[9]) || 0,
        recurring: row[10] || 'none',
        timeEstimate: 0,
        tags: [],
        modifiedDate: row[11] || createdDate,
    };
};

// Fetch all tasks from sheet
export const fetchTasksFromSheet = async () => {
    const token = getAccessToken();
    const spreadsheetId = getSheetId();
    if (!token || !spreadsheetId) return null;

    try {
        const parsedId = JSON.parse(spreadsheetId);
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: parsedId,
            range: `${SHEET_NAME}!A2:L`,
        });

        const rows = response.result.values || [];
        return rows.map(rowToTask).filter(Boolean);
    } catch (e) {
        console.error('Failed to fetch from Sheets:', e);
        if (e.status === 404) {
            // Sheet deleted, clear ref
            localStorage.removeItem('taskmanager_sheet_id');
        }
        return null;
    }
};

// Sync all tasks to sheet (full overwrite)
export const syncTasksToSheet = async (tasks) => {
    const token = getAccessToken();
    let spreadsheetId = getSheetId();
    if (!token) return false;

    try {
        if (!spreadsheetId) {
            spreadsheetId = await createSpreadsheet();
        }
        const parsedId = typeof spreadsheetId === 'string' ? JSON.parse(spreadsheetId) : spreadsheetId;

        // Clear existing data (keep header)
        await window.gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: parsedId,
            range: `${SHEET_NAME}!A2:L`,
        });

        if (tasks.length === 0) return true;

        // Write all tasks
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: parsedId,
            range: `${SHEET_NAME}!A2`,
            valueInputOption: 'RAW',
            resource: {
                values: tasks.map(taskToRow),
            },
        });

        return true;
    } catch (e) {
        console.error('Failed to sync to Sheets:', e);
        return false;
    }
};

// Add a single task row
export const addTaskToSheet = async (task) => {
    const token = getAccessToken();
    let spreadsheetId = getSheetId();
    if (!token) return false;

    try {
        if (!spreadsheetId) {
            spreadsheetId = await createSpreadsheet();
        }
        const parsedId = typeof spreadsheetId === 'string' ? JSON.parse(spreadsheetId) : spreadsheetId;

        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: parsedId,
            range: `${SHEET_NAME}!A:L`,
            valueInputOption: 'RAW',
            resource: {
                values: [taskToRow(task)],
            },
        });

        return true;
    } catch (e) {
        console.error('Failed to add task to Sheets:', e);
        return false;
    }
};

// Export report to a new sheet
export const exportReport = async (reportData, title) => {
    const token = getAccessToken();
    let spreadsheetId = getSheetId();
    if (!token) return false;

    try {
        if (!spreadsheetId) {
            spreadsheetId = await createSpreadsheet();
        }
        const parsedId = typeof spreadsheetId === 'string' ? JSON.parse(spreadsheetId) : spreadsheetId;

        // Add a new sheet for the report
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: parsedId,
            requests: [{
                addSheet: {
                    properties: { title: title }
                }
            }]
        });

        // Write report data
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: parsedId,
            range: `${title}!A1`,
            valueInputOption: 'RAW',
            resource: {
                values: reportData,
            },
        });

        return true;
    } catch (e) {
        console.error('Failed to export report:', e);
        return false;
    }
};
