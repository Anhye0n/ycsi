const express = require('express')
const app = express()

const bodyParser = require('body-parser'), path = require('path'), serveStatic = require('serve-static'), favicon = require('serve-favicon')


app.use(bodyParser.urlencoded({extend: false}))

app.use(bodyParser.json())

app.set('/', path.join(__dirname, 'views'))

app.get("*", (req, res, next) => {
    console.log("req.secure == " + req.secure);

    if (req.secure) {
        // --- https
        next();
    } else {
        // -- http
        let to = "https://" + req.headers.host + req.url;
        console.log("to ==> " + to);

        return res.redirect("https://" + req.headers.host + req.url);
    }
})

app.use('/', serveStatic(path.join(__dirname, 'views')))
app.use(favicon(path.join(__dirname, './views/src/img', 'favicon.ico')));

const http = require("http")
const https = require("https")
const fs = require("fs")

let privateKey = fs.readFileSync("/etc/letsencrypt/live/anhye0n.me/privkey.pem")
let certificate = fs.readFileSync("/etc/letsencrypt/live/anhye0n.me/cert.pem")
let ca = fs.readFileSync("/etc/letsencrypt/live/anhye0n.me/chain.pem")
const credentials = {key: privateKey, cert: certificate, ca: ca}


// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});

/*app.get('/', function (req, res){
    res.redirect('/')
})*/

/*app.listen(8088, function () {
    console.log('ycsi server is open(port: 8088) http://anhye0n.me:8088')
})*/

module.exports = app;