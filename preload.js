const electron = require('electron')
const ipc = electron.ipcRenderer

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('web_btn').addEventListener("click", function () {
        let active_hotspot_id = localStorage.getItem('active_hotspot_id')
        const reply = ipc.sendSync('hotspot-event', active_hotspot_id)
    });
    document.getElementById("btn-exit").addEventListener("click",() => { ipc.send('close') });
    document.getElementById("btn-hideToTray").addEventListener("click",() => { ipc.send('trayHide') });
})

