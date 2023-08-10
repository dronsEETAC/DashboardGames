const fs = require('fs')

const mosquittoCA = fs.readFileSync('./rootCA.crt');

module.exports = {
    devServer: {
      https: {
        key: fs.readFileSync('../../mobileAppCertificates/localhostIP.key'),
        cert: fs.readFileSync('./localhostIP.crt'),
        ca: fs.readFileSync('./rootCA.crt'),
      }
    },

  }



  

     