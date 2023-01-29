const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path')

// Web stuff
const express = require("express")
const webApp = express()
const server = require('http').createServer(webApp)
const io = require('socket.io')(server);
const webPort = 8000

const osc = require('osc')

function parseOSC(data) {
    switch(data) {
        case "/xbncg/show":
            console.log('[GFX] Showing CG')
            io.emit("showCG");
            break
        case "/xbncg/toggle":
            console.log('[GFX] Toggling CG')
            io.emit("toggleCG");
            break
        case "/xbncg/hide":
            console.log('[GFX] Hiding CG')
            io.emit("hideCG");
            break
        case "/xbncg/kill":
            console.log('[GFX] Killing CG')
            io.emit("killCG");
            break
        default:
            console.log('[OSC] Unknown command')
    }
}

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 3000
})
udpPort.on("ready", function () {
    console.log("[OSC] Listening over UDP on port: 3000")
})
udpPort.on("message", function (oscMessage) {
    parseOSC(oscMessage['address'].toLowerCase())
})
udpPort.on("error", function (err) {
    console.log(err)
})

// Open all the servers!
server.listen(webPort, () => { console.log(`[Webserver] CG Webserver is listening on port: ${webPort}`)})
udpPort.open()
webApp.use(express.static(path.join(__dirname, 'www')))

io.on('connection', (socket) => {
    console.log('[Sockets] A new client has connected!')
    socket.on("sendCommand", (oscCommand) => {
        parseOSC(oscCommand);
    })
})

let tray = null
let mainWindow = null

function createTray () {
    // Check what the host operating system is...
    if(process.platform == 'darwin') { 
        // okay we're running macOS, use a white icon for the menu bar.
        const icon = path.join(__dirname, '/icons/xbncg-tray.png')
        const trayicon = nativeImage.createFromPath(icon)
        tray = new Tray(trayicon.resize({ width: 16 }))
    } else {
        // cool, we're not running macOS, so we can use a coloured icon!
        const icon = path.join(__dirname, '/icons/xbncg.png')
        const trayicon = nativeImage.createFromPath(icon)
        tray = new Tray(trayicon.resize({ width: 16 }))
    }
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                createWindow();
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Show CG',
            click: () => {
                parseOSC("/xbncg/show");
            }
        },
        {
            label: 'Toggle CG',
            click: () => {
                parseOSC("/xbncg/toggle");
            }
        },
        {
            label: 'Hide CG',
            click: () => {
                parseOSC("/xbncg/hide");
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                parseOSC("/xbncg/hide");
                app.quit() // actually quit the app.
            }
        },
    ])

    tray.setContextMenu(contextMenu)
}

function setMainMenu() {
    const template = [
        {
            label: "XBNCG Graphics Server",
            submenu: [
                {
                    label: "Run in Background",
                    accelerator: process.platform === 'darwin' ? 'Cmd+W' : 'Ctrl+W',
                    click: (menuItem, browserWindow, event) => {
                        app.dock.hide();
                        if(mainWindow) { mainWindow.hide() }
                        mainWindow = null
                    }
                },
                {
                    label: "Shutdown Server",
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
                    click: (menuItem, browserWindow, event) => {
                        app.quit();
                    }
                }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }

const createWindow = () => {
    // If the tray doesn't exist, make it!
    if (!tray) {
        createTray()
    }
    // Create the browser window if mainWindow is set to null.
    if(!mainWindow) {
        mainWindow = new BrowserWindow({
            width: 400,
            height: 600,
            webPreferences: {
            preload: path.join(__dirname, 'preload.js')
            },
            frame: false,
            resizable: false,
            icon: 'icons/xbncg.png',
            title: "XBNCG Graphics Server",
            backgroundColor: "#171717",
            show: false
        })
    
        app.setName("XBNCG");
    
        // and load the index.html of the app.
        mainWindow.loadFile('html/index.html')
        
        // Remove all default menus, just leave the basic controls to quit the app.
        setMainMenu();

        mainWindow.on('ready-to-show', () => {
            mainWindow.show();
            mainWindow.focus();
            if(process.platform==='darwin') { app.dock.show() }
        })
    }

    // Once the main window has closed, remove from the dock and nullify it so the above can be executed again.
    mainWindow.on('closed', () => {
        if(process.platform==='darwin') { app.dock.hide() }
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// IPC events
ipcMain.on('hotspot-event', (event, arg) => {
    event.returnValue = 'Message received!'
    require('electron').shell.openExternal(`http://127.0.0.1:${webPort}`)
})
ipcMain.on('close', () => {
    parseOSC("/xbncg/hide");    
    app.quit()
})
ipcMain.on('trayHide', () => {
    if(process.platform==='darwin') { app.dock.hide() }
    if(mainWindow) { mainWindow.hide() }
    mainWindow = null
})

// Once all windows are closed, hide to the tray.
app.on('window-all-closed', () => {
    if(process.platform==='darwin') { app.dock.hide() }
    if(mainWindow) { mainWindow.hide() }
    mainWindow = null
})
