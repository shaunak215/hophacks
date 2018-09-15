var express = require('express')
  , router = express()
  , multer = require('multer')

var ejs = require('ejs');

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
const NODEJS_DIR = __dirname + "\\";

process.chdir(DARKNET_EXE);

var shelter_capacity = {
	'HelpingUp': 1,
	'RuthMD': 4,
	'Veteran': 12,
	'JHack': 0
};

router.get("/test", function(req, res){
	console.log("Test");
	res.send("Test");
});

router.post("/test", function(req, res){
	var contype = req.headers['content-type'];
	console.log(contype);

	console.log("Test Post");
	res.send("{}");
});

router.post('/upload', function(req, res) {
	//Extract some of the HTTP headers if they exist
	var base64Data = req.rawBody.replace(/^data:image\/jpeg;base64,/, "");

	//Write the file
	fs.writeFile(NODEJS_DIR + "out.jpg", base64Data, 'base64', function(err) {
		//HACK: Horribly hacky interfacing with Darknet
		//Actually send the file to YOLO for processing
		console.log(err);
		console.log(req.rawBody);

		const ls = spawn(DARKNET_EXE + "darknet_no_gpu", ['detector', 'test', 'cfg/coco.data', 'cfg/yolov3.cfg', 
			'yolov3.weights', NODEJS_DIR + "out.jpg", "-dont_show"]);

		let personCount = 0;

		ls.stderr.on('data', (data) => {
			console.log(data.toString());
		});

		ls.stdout.on('data', (data) => {
			//Extract the number of people from the output
			personCount += (data.toString().match(new RegExp("person", "g")) || []).length;
		});

		ls.on('close', (code) => {
			console.log("There are " + personCount + " people");
			//Parse query params
			shelter_capacity[req.query.shelter] = personCount;
			res.send("{}");
		});
	});
});

const shelter_options = {
	'HelpingUp': {
		max: 4,
		page: fs.readFileSync(NODEJS_DIR + '/views/HelpingUp.html').toString()
	},
	'RuthMD': {
		max: 8,
		page: fs.readFileSync(NODEJS_DIR + '/views/RuthMD.html').toString()
	},
	'Veteran': {
		max: 12,
		page: fs.readFileSync(NODEJS_DIR + '/views/Veteran.html').toString()
	},
	'JHack': {
		max: 42,
		page: fs.readFileSync(NODEJS_DIR + '/views/JHack.html').toString()
	}};

router.get('/shelter', function(req, res){
	//Locate shelter
	let capacity = shelter_capacity[req.query.shelter];
	let maxCapacity = shelter_options[req.query.shelter].max;	

	//Load file
	let pageHTML = shelter_options[req.query.shelter].page;
	let cappert = (capacity/maxCapacity * 100);
	let status = "bg-success";

	if(cappert > 25) {
		status = "bg-warning";
	} 
	if(cappert > 75) {
		status = "bg-danger";
	}

	//Findall replace
	pageHTML = pageHTML.replace("$current$", "" + capacity);
	pageHTML = pageHTML.replace("$max$", "" + maxCapacity);
	pageHTML = pageHTML.replace("$cappert$", "" + cappert + "%");
	pageHTML = pageHTML.replace("$status$", "" + status);

	res.send(pageHTML);
});

router.get('/', function(req, res){
	console.log("New connection");
	res.sendFile(NODEJS_DIR + '/views/index.html');
});

router.get('/vars', function(req, res){
	res.send(shelter_capacity["JHack"] + "," + shelter_options["JHack"].max + "," + (shelter_capacity["JHack"]/shelter_options["JHack"].max * 100));
});

//Just a basic demonstration thing
router.get('/letmesee', function(req, res){
	res.sendFile(NODEJS_DIR + '/views/letmesee.html');
});

router.use('/assets', express.static(NODEJS_DIR + "/views/assets"))
router.use('/static', express.static(DARKNET_EXE))

router.listen(3000);
console.log("Server listening on port 3000");
console.log("Darknet Dir: " + DARKNET_EXE);
console.log("NodeJS Context: " + NODEJS_DIR);

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}