const express = require('express')
const path = require('path'), serveStatic = require('serve-static')
const app = express()

app.use('/', serveStatic(path.join(__dirname, 'views')))

// app.get('/', function (req, res){
//     res.redirect('/')
// })

app.listen(8088, function () {
    console.log('ycsi server is open(port: 80) http://anhye0n.me/ycsi')
})
