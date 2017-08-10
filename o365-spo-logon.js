const rp = require('request-promise');
const xmlParse = require('xml-parser');

module.exports = function (userName, passWord, targetLoginPage){
 return rp('https://login.microsoftonline.com/extSTS.srf', {
  method: 'POST',
  body: getSAMLRequest(userName, passWord, targetLoginPage),
  headers: {
    Accept: "application/soap+xml; charset=utf-8"
  }
}).then(res => {
  var xml = xmlParse(res);
  var body = xml.root.children.find((n) => n.name === 'S:Body');
  var rsp = body.children[0];
  var rst = rsp.children.find((n) => n.name === 'wst:RequestedSecurityToken')
  if (rst.children[0] && rst.children[0].content) {
    var binSecTk = rst.children[0].content;
    return binSecTk;
  }
}).then(secTk => {
  return rp(targetLoginPage, {
    method: 'POST',    
    body: secTk,
    resolveWithFullResponse: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}).then(rsp=>{
  console.log('Unexpected response received while obtaining access tokens', rsp.statusCode, rsp.headers);
}, err=>{
  if (err.response.statusCode === 302){
    var cookies = err.response.headers['set-cookie'];
    return Object.keys(cookies).map(k=>cookies[k].substring(0, cookies[k].indexOf(';'))).join('; ');
    
  } else{
    throw err;
  }
})
}

function getSAMLRequest(userName, password, url) {
  return '<s:Envelope \
                        xmlns:s="http://www.w3.org/2003/05/soap-envelope" \
                        xmlns:a="http://www.w3.org/2005/08/addressing" \
                        xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"> \
                        <s:Header> \
                            <a:Action s:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/02/trust/RST/Issue</a:Action> \
                            <a:ReplyTo> \
                                <a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address> \
                            </a:ReplyTo> \
                            <a:To s:mustUnderstand="1">https://login.microsoftonline.com/extSTS.srf</a:To> \
                            <o:Security \
                                s:mustUnderstand="1" \
                                xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"> \
                                <o:UsernameToken> \
                                    <o:Username>' + userName + '</o:Username> \
                                    <o:Password>' + password + '</o:Password> \
                                </o:UsernameToken> \
                            </o:Security> \
                        </s:Header> \
                        <s:Body> \
                            <t:RequestSecurityToken xmlns:t="http://schemas.xmlsoap.org/ws/2005/02/trust"> \
                                <wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"> \
                                    <a:EndpointReference> \
                                        <a:Address>' + url + '</a:Address> \
                                    </a:EndpointReference> \
                                </wsp:AppliesTo> \
                                <t:KeyType>http://schemas.xmlsoap.org/ws/2005/05/identity/NoProofKey</t:KeyType> \
                                <t:RequestType>http://schemas.xmlsoap.org/ws/2005/02/trust/Issue</t:RequestType> \
                                <t:TokenType>urn:oasis:names:tc:SAML:1.0:assertion</t:TokenType> \
                            </t:RequestSecurityToken> \
                        </s:Body> \
                    </s:Envelope> \
                    ';
}