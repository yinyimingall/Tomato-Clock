chrome.app.runtime.onLaunched.addListener(launch);

function launch() {
  chrome.app.window.create('window.html', {
       id: 'main',
       bounds: {
           width: 1024,
           height: 720,
           left: 100,
           top: 100
       },
       minWidth: 960,
       minHeight: 640,
       alwaysOnTop: true
   });
}
