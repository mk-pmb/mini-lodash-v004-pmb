/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var nodeStart = Date.now(), yUNoExit = require('wtfnode').dump,
  chProc = require('child_process'), origSpawn = chProc.spawn,
  lodashCli, lostChildren = {};

function logSpawn(cmd, args, opts) {
  var child = origSpawn(cmd, args, opts), pid = child.pid;
  cmd = [cmd].concat(args && args.slice().map(function (arg) {
    return arg.replace(/^\/\S+(\/node_modules\/)/, '/…$1');
  }));
  lostChildren[pid] = cmd;
  console.log({ child: pid, spawn: cmd });
  child.on('exit', function (retval, signal) {
    delete lostChildren[pid];
    console.log({ despawn: pid, retval: retval, signal: signal, cmd: cmd });
  });
  ['in', 'out', 'err'].forEach(function (chan) {
    var strm = child['std' + chan];
    strm.on('end', function () { console.log({ child: pid, end: chan }); });
  });
  return child;
}
chProc.spawn = logSpawn;

function runDura(what) {
  var now = Date.now();
  console.log('@', ((now - nodeStart) / 1000).toFixed(2), 'seconds:', what);
}


runDura('gonnaRequireLodashCli');
lodashCli = require('lodash-cli');
runDura('hasRequiredLodashCli');


function scheduleForcedExit() {
  runDura('scheduleForcedExit');
  console.log('lostChildren:', lostChildren);
  setTimeout(function () {
    runDura('process.exit');
    process.exit();
  }, 500).unref();
  yUNoExit();
}


runDura('invokeLodashCli');
lodashCli([
  'category=util',
  'include=each',
  'exports=amd,global',
], function (result) {
  console.log(result.source.split(/\*\/\s*\n/)[0]);
  setTimeout(scheduleForcedExit, 10000).unref();
});
