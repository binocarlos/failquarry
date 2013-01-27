#!/usr/bin/env node

var Hook = require('hook.io').Hook;

var hook = new Hook( {
    name: 'vanilla-hook',
    debug: true
});

hook.start();