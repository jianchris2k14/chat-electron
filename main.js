// Imported Modules
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const axios = require('axios');
const dotenv = require('dotenv').config();

// Global Variables
const isDev = false;
const isMac = process.platform === 'darwin';
const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label: 'App Logs',
        click: logsWindow
      },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'minimize' },
      { role: 'togglefullscreen' },
    ]
  }
];

// Main Window
const createWindow = () => {
  const main = new BrowserWindow({
    width: isDev ? 1200 : 800,
    height: 800,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    main.webContents.openDevTools();
  }

  main.loadFile(path.join(__dirname, "./renderer/index.html"));
};

// Application Logs Window
function logsWindow () {
  const logs = new BrowserWindow({
    width: 1100,
    height: 500,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  logs.setMenuBarVisibility(false);

  if (isDev) {
    logs.webContents.openDevTools();
  }

  logs.loadFile(path.join(__dirname, "./renderer/logs.html"));
}

app.whenReady().then(() => {
  // Initialize Functions
  ipcMain.handle('axios.openAI', openAI);
  ipcMain.handle('axios.backend', backend);
  // Create Main Window
  createWindow();
  // Start Window
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Close Window
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Main Functions
// Axios OpenAI API
async function openAI(event, conversation){
  let result = null;
  const env = dotenv.parsed;
  // Axios Setup for OpenAi
  await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/completions',
      data: {
        model: "text-davinci-003",
        prompt: "Junjun is a chatbot that reluctantly answers questions with sarcastic responses:\n\n" + conversation,
        temperature: 0.5,
        max_tokens: 60,
        top_p: 0.3,
        frequency_penalty: 0.5,
        presence_penalty: 0.0
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.APIKEY_OPENAI
      }
    }).then(function (response) {
      result = response.data;
    })
    .catch(function (error) {
      result = error.response.data;
    });
  return result;
}

// Axios Laravel API
async function backend(event, method, path, data = null, token = ''){
  let result = null;
  // Axios Setup for Laravel Backend
  await axios({
      method: method,
      url: 'http://backend.test/api/' + path,
      headers: ( token == '' ? 
          { 
            'Accept': 'application/json',
          }: 
          {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
          }),
      data: data
    }).then(function (response) {
      result = response.data;
    })
    .catch(function (error) {
      result = error.response.data;
    });
  return result;
}
