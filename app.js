const express = require('express')
const path = require('path'), serveStatic = require('serve-static')
const app = express()

app.use('/ycsi', serveStatic(path.join(__dirname, 'views')))

app.get('/', function (req, res){
    res.redirect('/ycsi')
})

app.listen(80, function () {
    console.log('ycsi server is open(port: 80) http://anhye0n.me/ycsi')
})
