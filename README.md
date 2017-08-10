# sp-workbench-api-proxy
Provides an authenticated proxy to Office 365 + SharePoint Online or an on-prem SharePoint installation. Use as a part of development with SpFx Workbench or a custom toolchain.


Setup
===========

1. 
npm i --save-dev sp-workbench-api-proxy

2. 
for Workbench dev:

const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');
const spApiProxy = require('sp-workbench-api-proxy')

build.initialize(gulp);

gulp.task('serve2', ['serve'], function(){
    spApiProxy(require('./config/sp_deploy_settings.json'))
})

3. 
Create file ./config/sp_deploy_settings.json

{
  "siteUrl": "https://<tenant>.sharepoint.com/sites/<site>/",
  "projectName": "project",
  "credentials": {
    "userName": "user@tenant.onmicrosoft.com",
    "passWord": "**************"
  }
}

4. 

Add the following line to .gitignore

/config/sp_deploy_settings.json