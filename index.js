const express = require('express');
const proxy = require('http-proxy-middleware');
const spoLogon = require('./o365-spo-logon');

module.exports = function (deployConf) {
    var passthroughCookies = false;
    const targetUri = require('url').parse(deployConf.siteUrl);
    const targetAuthority = targetUri.protocol + '//' + targetUri.host;
    const targetLoginPage = targetAuthority + '/_forms/default.aspx?wa=wsignin1.0';
    const httpsTarget = targetUri.protocol === 'https:' || targetUri.protocol === 'https';

    const negotiateAuth = deployConf.credentials.type === 'negotiate';
    if (negotiateAuth) {
        var KAAgent = require('agentkeepalive');
        if (httpsTarget) {
            KAAgent = KAAgent.HttpsAgent;
        }
    }

    var reqCookies;

    var keepaliveAgent;

    if (!deployConf.credentials.type || deployConf.credentials.type === 'spo') {
        spoLogon(deployConf.credentials.userName, deployConf.credentials.passWord, targetLoginPage)
            .then(cookies => reqCookies = cookies);
    } else if (negotiateAuth) {
        keepaliveAgent = new KAAgent({
            maxSockets: 1,
            keepAlive: true,
            maxFreeSockets: 10,
            keepAliveMsecs: 1000,
            timeout: 60000,
            keepAliveTimeout: 90000 // free socket keepalive for 30 seconds
        });
    }

    const proxyRoute = proxy(['/_api', '/_vti_bin'], {
        target: targetAuthority,
        pathRewrite: function (path, req) { return (targetUri.path + path).replace('//', '/') },
        secure: httpsTarget,
        changeOrigin: true,
        auth: negotiateAuth ? 'LOGIN:PASS' : undefined,
        logLevel: 'debug',
        agent: keepaliveAgent,
        onProxyRes: function onProxyRes(proxyRes, req, res) {
            console.log('RSP', req.url, proxyRes.statusCode);
            if (negotiateAuth) {
                const key = 'www-authenticate';
                proxyRes.headers[key] = proxyRes.headers[key] && proxyRes.headers[key].split(',');
            }
        },
        onProxyReq: function onProxyReq(proxyReq, req, res) {
            if (passthroughCookies && req.headers && req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
            } else if (reqCookies) {
                console.log('cookies set, enabligh session pass-through');
                proxyReq.setHeader('Cookie', reqCookies);
                //passthroughCookies = true;
            }
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
        }
    }
    )

    const port = (deployConf.serve && deployConf.serve) || 5430;

    var app = express();
    app.use(proxyRoute);

    try {
        const certs = require('@microsoft/gulp-core-build-serve/lib/CertificateStore')
        const https = require('https');

        https.createServer({
            key: certs.default.instance.keyData,
            cert: certs.default.instance.certificateData,
            requestCert: false,
            rejectUnauthorized: false
        }, app).listen(port);
    } catch(e){
        //Presuming setup sans sp worbench;
        app.listen(port);
    }
}