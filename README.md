# sp-workbench-api-proxy
Provides an authenticated proxy to Office 365 + SharePoint Online or an on-prem SharePoint installation. Use as a part of development with SpFx Workbench or a custom toolchain.


##Setup

1. Install sp-workbench-api-proxy dependency
```bash
npm i --save-dev sp-workbench-api-proxy
```

2. For development as a part of SPFx Workbench:
```javascript
const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');
const spApiProxy = require('sp-workbench-api-proxy')

build.initialize(gulp);

gulp.task('serve2', ['serve'], function(){
    spApiProxy(require('./config/sp_deploy_settings.json'))
})
```

3. Create a new file ./config/sp_deploy_settings.json (from project root)
```json
{
  "siteUrl": "https://{tenant}.sharepoint.com/sites/{site}/",
  "projectName": "project",
  "credentials": {
    "userName": "{user}@{tenant}.onmicrosoft.com",
    "passWord": "**************"
  }
}
```

4. Add the following line to .gitignore
```
/config/sp_deploy_settings.json
```