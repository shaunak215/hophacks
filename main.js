var express = require('express')
  , router = express()
  , multer = require('multer')


var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

var bodyParser = require('body-parser');
router.use(bodyParser.raw({limit: '50mb', verify: rawBodySaver, type: function () { return true } }));
var fs = require("fs");
var spawn = require('child_process').spawn;

//Configuration constants
const DARKNET_EXE = "C:\\Users\\MLH Admin\\darknet\\build\\darknet\\x64\\";
const IMAGE_OUTPUT = "C:\\Users\\MLH Admin\\Desktop\\Proj\\";
const NODEJS_DIR = __dirname;

process.chdir(DARKNET_EXE);

var shelter_capacity = {};

router.post('/upload', function(req, res) {	
	//Parse query params


	//Extract some of the HTTP headers if they exist
	var base64Data = req.rawBody.replace(/^data:image\/jpeg;base64,/, "");

	//Write the file
	fs.writeFile(IMAGE_OUTPUT + "out.jpg", base64Data, 'base64', function(err) {
		//HACK: Horribly hacky interfacing with Darknet
		//Actually send the file to YOLO for processing
		const ls = spawn(DARKNET_EXE + "darknet_no_gpu", ['detector', 'test', 'cfg/coco.data', 'cfg/yolov3.cfg', 
			'yolov3.weights', IMAGE_OUTPUT + "out.jpg", "-dont_show"]);

		let personCount = 0;

		ls.stderr.on('data', (data) => {
			//console.log(data.toString());
		});

		ls.stdout.on('data', (data) => {
			//Extract the number of people from the output
			personCount += (data.toString().match(new RegExp("person", "g")) || []).length;
		});

		ls.on('close', (code) => {
			console.log("There are " + personCount + " people");
		});
	});
});

router.get('/shelter', function(req, res){
	//Locate shelter
	//Load the HTML file as a string
	//Findall replace
});

router.get('/', function(req, res){
	console.log("New connection");
	res.sendFile(NODEJS_DIR + '/views/test.html');
});

//Just a basic demonstration thing
router.get('/letmesee', function(req, res){
	res.sendFile(NODEJS_DIR + '/views/letmesee.html');
});

router.use('/static', express.static(DARKNET_EXE))

router.listen(3000);
console.log("Server listening on port 3000");