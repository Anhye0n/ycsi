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
const video = document.getElementById("video");
const canvas = document.getElementById("output");

let squareSize
let inputSize = 320;
let outputSize = 6300;
let clses = 6;

if (screen.availWidth >= 640){
    squareSize = 640;
    // 수정
    // squareSize = 320;
} else{
    squareSize = screen.availWidth;
    // 수정
    // squareSize = 320;
}

// alert(squareSize)

let classes = {
    '0': '칠성사이다',
    '1': '코카콜라',
    '2': '코카콜라제로',
    '3': '펩시',
    '4': '포카리스웨트',
    '5': '스프라이트'
}
/*'0': 'Chilsung',
    '1': 'Coca-Cola',
    '2': 'Coca-Zero',
    '3': 'Pepsi',
    '4': 'PocariSweat',
    '5': 'Sprite'*/
const constraints = {
    video: {facingMode: "environment"}, audio: false
};

const ctx = canvas.getContext('2d');
//const xy_cal = tf.tensor2d([320, 0, 320, 0, 0, 320, 0, 320, -160, 0, 160, 0, 0, -160, 0, 160], [4, 4]);
const xy_cal = tf.tensor2d([1, 0, 1, 0, 0, 1, 0, 1, -0.5, 0, 0.5, 0, 0, -0.5, 0, 0.5], [4, 4]).mul(tf.scalar(squareSize));


/*canvas.width = width;
canvas.height = height;*/

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
let voices = [];
let cls_cnt = [];
let cnt = 0;
let flag = true;

for(let i = 0; i < clses; i++){
    cls_cnt.push(0);
}


let model = tf.loadGraphModel('indexeddb://my-model').catch(function(err){
    (model = tf.loadGraphModel('./model/model.json')).then(function(){
        model.then(function (res) {
            res.save('indexeddb://my-model');
        });
    });
});
const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]
const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))

function setVoiceList() {
    voices = window.speechSynthesis.getVoices();
}

setVoiceList();

if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setVoiceList;
}

setTimeout(function() {
    src = new cv.Mat(height, width, cv.CV_8UC4);
    cap = new cv.VideoCapture("video");
    window.setInterval(function(){
        if(flag == true){
            flag = false;
            process();
        }
    },100);
}, 5000);

// let RandomColor = "#" + Math.round(Math.random() * 0xffffff).toString(16);

function process() {
    cap.read(src);
    let rect = new cv.Rect(video.width / 2 - squareSize / 2, video.height / 2 - squareSize / 2, squareSize, squareSize);
    let out_dst = src.roi(rect);
    let dst = new cv.Mat();
    let dsize = new cv.Size(inputSize, inputSize);
    cv.resize(out_dst, dst, dsize, 0, 0, cv.INTER_AREA);
    let tmp = new cv.Mat();
    cv.cvtColor(dst, tmp, cv.COLOR_RGBA2RGB);
    model.then(function (res) {
        tf.engine().startScope();
        let dst_tensor = tf.tensor(tmp.data, [inputSize, inputSize, 3]);
        dst_tensor = dst_tensor.expandDims(0);
        dst_tensor = dst_tensor.div(tf.scalar(255));
        let pred = res.predict(dst_tensor).reshape([outputSize, 5+clses]);
        let box = pred.slice([0, 0], [outputSize, 4]);
        let score = pred.slice([0, 4], [outputSize, 1]).reshape([outputSize]);
        let cls = pred.slice([0, 5], [outputSize, clses]);
        cls = cls.argMax(1);
        box = box.matMul(xy_cal);
        let maxSup = tf.image.nonMaxSuppression(box, score, maxOutputSize = 1000, iouThreshold = 0.5, scoreThreshold = 0.25);
        let box_array = box.dataSync();
        box_array = Array.from(box_array);
        let cls_array = cls.dataSync();
        cls_array = Array.from(cls_array);
        xy_array = [];
        for (let i = 0; i < box_array.length; i += 4) {
            xy_array.push([box_array[i], box_array[i + 1], box_array[i + 2], box_array[i + 3]]);
        }
        maxSup = maxSup.dataSync();
        maxSup = Array.from(maxSup);
        cv.imshow('output', out_dst);
        let max_size = 0;
        let max_num = 0;
        for (i = 0; i < maxSup.length; i++) {
            let x1 = parseInt(xy_array[maxSup[i]][0]);
            let y1 = parseInt(xy_array[maxSup[i]][1]);
            let x2 = parseInt(xy_array[maxSup[i]][2]);
            let y2 = parseInt(xy_array[maxSup[i]][3]);
            ctx.strokeStyle = 'red'; // 선 색
            ctx.lineWidth = 3; // px단위
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.font = "25px Noto Serif KR";
            ctx.fillStyle = 'red';
            ctx.fillText(classes[cls_array[maxSup[i]]], x1, y1 - 10);
            console.log(cls_array[maxSup[i]])
            max_size = (max_size < (x2 - x1) * (y2 - y1)) ? (x2 - x1) * (y2 - y1) : max_size;
            max_num = (max_size < (x2 - x1) * (y2 - y1)) ? i : max_num;
        }
        if(maxSup.length !== 0){
            cls_cnt[cls_array[maxSup[max_num]]] += 1;
            cnt += 1;
            if(cnt > 8){
                speak(classes[argMax(cls_cnt)]);
                cnt = 0;
                for(let i = 0 ; i < cls_cnt.length; i++){
                    cls_cnt[i] = 0;
                }
            }
        }
        out_dst.delete();
        dst.delete();
        tmp.delete();
        tf.engine().endScope();
    });
    flag = true;
}
function speak(txt) {
    console.log(txt);
    let lang = 'ko-KR';
    let utterThis = new SpeechSynthesisUtterance(txt);
    let voiceFound = false;
    for (let i = 0; i < voices.length; i++) {
        if (voices[i].lang.indexOf(lang) >= 0 || voices[i].lang.indexOf(lang.replace('-', '_')) >= 0) {
            utterThis.voice = voices[i];
            voiceFound = true;
        }
    }
    if (!voiceFound) {
        alert('voice not found');
        return;
    }
    utterThis.lang = lang;
    utterThis.pitch = 1;
    utterThis.rate = 1;
    window.speechSynthesis.speak(utterThis);
}