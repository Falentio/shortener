const express = require ('express')
const bodyParser = require('body-parser')
const fs = require('fs-extra')
const multer = require('multer')

const app = express()
const upload = multer({dest : __dirname + '/cache'})

const setting = JSON.parse(fs.readFileSync('./setting.json'))
const data = JSON.parse(fs.readFileSync('./data.json'))

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.use(bodyParser.json())
app.use(allowCrossDomain)

app.get('/upload', (req,res)=>{
	pw = req.query.pw
	if(pw === setting.password)res.sendFile(__dirname + '/upload.html')
	else res.send('incorrect password,default password is "12345678",use password in query like "example.com/upload?pw=12345678"')
})

app.post('/upload',upload.single('datajson'),(req,res)=>{
    fs.writeFileSync('./data.json',fs.readFileSync(req.file.path))
    fs.remove(req.file.path)
    res.send('succes change url database')
})

app.get('/download', async(req,res)=>{
	pw = req.query.pw
	if(pw === setting.password)res.download('./data.json')
	else res.send('incorrect password,default password is "12345678",use password in query like "example.com/download?pw=12345678" ')
})

app.get('/create', async(req,res)=>{
	pathExist = false
	if(req.query.urlSH === undefined)res.send('url tidak ditemukan')
	url = req.originalUrl.replace('/create?urlSH=','').replace(`&pathSH=${req.query.pathSH}`,'')
    path = req.query.pathSH
    if(!(url.startsWith('https://') || url.startsWith('http://')))url = `http://${url}`
    test = () =>{for(our in data){
    	pathExist = (data[our].path === path)
    	if(pathExist){
    		desc = 'path already exist,so your path get up to 3 digit random number'
    	    path += Math.floor(Math.random()*999)
    	    test()
    	    break
    	}
    }};test()
    data.push({url:url,path:path})
    fs.writeFileSync('./data.json',JSON.stringify(data))
    res.send({originalUrl : url,shortUrl : `http://${req.hostname +'/'+ path}`,desc : desc})
})

app.get('/:path', async(req,res)=>{
	error = true
	path = req.params.path
	for(our in data){
		if(data[our].path === path){
			url = data[our].url
			error = false
			break
		}
	}
	if(error){
		res.send('cant find url')
	}else{
		res.redirect(url)
	}
    
})

app.listen(process.env.PORT || 3001 , console.log('listening port 3001'))