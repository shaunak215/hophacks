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
const NODEJS_DIR = __dirname;

process.chdir(DARKNET_EXE);

var shelter_capacity = {
	'shelter1': 0,
	'shelter2': 0,
	'shelter3': 12
};

router.post('/upload', function(req, res) {	
	//Extract some of the HTTP headers if they exist
	var base64Data = req.rawBody.replace(/^data:image\/jpeg;base64,/, "");

	//Write the file
	fs.writeFile(NODEJS_DIR + "out.jpg", base64Data, 'base64', function(err) {
		//HACK: Horribly hacky interfacing with Darknet
		//Actually send the file to YOLO for processing
		const ls = spawn(DARKNET_EXE + "darknet_no_gpu", ['detector', 'test', 'cfg/coco.data', 'cfg/yolov3.cfg', 
			'yolov3.weights', NODEJS_DIR + "out.jpg", "-dont_show"]);

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
			//Parse query params
			shelter_capacity[req.query.shelter];
			res.send("Done");
		});
	});
});

const shelter_options = {
	'shelter1': {
		max: 4,
		page: fs.readFileSync(NODEJS_DIR + '/views/.html').toString()
	},
	'shelter2': {
		max: 8,
		page: fs.readFileSync(NODEJS_DIR + '/views/.html').toString()
	},
	'shelter3': {
		max: 12,
		page: fs.readFileSync(NODEJS_DIR + '/views/.html').toString()
	}}
router.get('/shelter', function(req, res){
	//Locate shelter
	let capacity = shelter_capacity[req.query.shelter];
	let maxCapacity = shelter_options[req.query.shelter].max;	

	//Load file
	let pageHTML = shelter_options[req.query.shelter].page;

	//Findall replace
	pageHTML = replaceAll(pageHTML, "$current$", "" + capacity);
	pageHTML = replaceAll(pageHTML, "$max$", "" + maxCapacity);

	res.send(pageHTML);
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
console.log("Darknet Dir: " + DARKNET_EXE);
console.log("NodeJS Context: " + NODEJS_DIR);

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}