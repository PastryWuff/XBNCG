module.exports = {
  packagerConfig: {
    name: 'XBNCG Graphics Server',
    productName: 'XBNCG Graphics Server',
    executableName: 'XBNCG',
    appCopyright: 'Developed by Doughnut Wuff (@PastryWuff)',
    icon: 'icons/xbncg'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
