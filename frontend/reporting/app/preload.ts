const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getPortableExecutableDir: () => process.env.PORTABLE_EXECUTABLE_DIR,
  // You can expose other functions or data here as needed
});
