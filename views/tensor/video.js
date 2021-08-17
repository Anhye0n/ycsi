let width, height;

function setSize() {
    if (window.orientation == 0) {
        //portrait
        width = 642;
        height = 856;
    } else {
        //landscape
        width = 856;
        height = 642;
    }
}
let classes = {
    '0': 'Chilseong',
    '1': 'Sprite'
}

const constraints = {
    video: {facingMode: "environment",}, audio: false
};

const video = document.getElementById("video");
const canvas = document.getElementById("output");
const ctx = canvas.getContext('2d');
//const xy_cal = tf.tensor2d([320, 0, 320, 0, 0, 320, 0, 320, -160, 0, 160, 0, 0, -160, 0, 160], [4, 4]);
const xy_cal = tf.tensor2d([640, 0, 640, 0, 0, 640, 0, 640, -320, 0, 320, 0, 0, -320, 0, 320], [4, 4]);

canvas.width = width;
canvas.height = height;

navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
        video.width = width;
        video.height = height;
        video.srcObject = stream;
        video.play();
    })
    .catch(function (error) {
        console.log(error);
    });

let src, cap;

const model = tf.loadGraphModel('./model/model.json');

setTimeout(function() {
    src = new cv.Mat(height, width, cv.CV_8UC4);
    cap = new cv.VideoCapture("video");
    window.setInterval(function(){
        process();
    },300);
}, 2000);

function process() {
    cap.read(src);
    let rect = new cv.Rect(video.width / 2 - 320, video.height / 2 - 320, 640, 640);
    let out_dst = src.roi(rect);
    let dst = new cv.Mat();
    let dsize = new cv.Size(320, 320);
    cv.resize(out_dst, dst, dsize, 0, 0, cv.INTER_AREA);
    let test = new cv.Mat();
    cv.cvtColor(dst, test, cv.COLOR_RGBA2RGB);
    test = tf.tensor(test.data, [320, 320, 3]);
    let dst_tensor = test;
    dst_tensor = dst_tensor.expandDims(0);
    dst_tensor = dst_tensor.div(tf.scalar(255));
    model.then(function (res) {
        let pred = res.predict(dst_tensor).reshape([6300, 7]);
        let box = pred.slice([0, 0], [6300, 4]);
        let score = pred.slice([0, 4], [6300, 1]).reshape([6300]);
        let cls = pred.slice([0, 5], [6300, 2]);
        cls = cls.argMax(1);
        box = box.matMul(xy_cal);
        let maxSup = tf.image.nonMaxSuppression(box, score, maxOutputSize = 1000, iouThreshold = 0.5, scoreThreshold = 0.25);
        box = box.dataSync();
        box = Array.from(box);
        cls = cls.dataSync();
        cls = Array.from(cls);
        xy_array = [];
        for (var i = 0; i < box.length; i += 4) {
            xy_array.push([box[i], box[i + 1], box[i + 2], box[i + 3]]);
        }
        maxSup = maxSup.dataSync();
        maxSup = Array.from(maxSup);
        cv.imshow('output', out_dst);
        for (i = 0; i < maxSup.length; i++) {
            let x1 = parseInt(xy_array[maxSup[i]][0]);
            let y1 = parseInt(xy_array[maxSup[i]][1]);
            let x2 = parseInt(xy_array[maxSup[i]][2]);
            let y2 = parseInt(xy_array[maxSup[i]][3]);
            ctx.strokeStyle = 'red'; // 선 색
            ctx.lineWidth = 3; // px단위
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.font = '25px serif';
            ctx.fillStyle = "red";
            ctx.fillText(classes[cls[maxSup[i]]], x1, y1 - 10);
        }
    });
}