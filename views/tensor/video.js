let width, height;

function setSize() {
    if (window.orientation == 0) {
        //portrait
        width = 1280;
        height = 720;
    } else {
        //landscape
        width = 428;
        height = 321;
    }
}

const constraints = {
    video: {facingMode: "environment"}, audio: false
    // video: {facingMode: "user"}, audio: false
};
const video = document.getElementById("video");
const canvas = document.getElementById('output');

const ctx = canvas.getContext('2d');

canvas.width = width;
canvas.height = height;

let streaming = false;

function toggleStream() {
    if (streaming === false) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                video.width = width;
                video.height = height;//prevent Opencv.js error.
                video.srcObject = stream;
                video.play();
            })
            .catch(function (error) {
                console.log(error);
            });
        document.getElementById('toggleStream').innerHTML = "Stop";
        document.getElementById('cvtGray').style.visibility = 'visible';
    } else {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
            track.stop();
        });
        document.getElementById('toggleStream').innerHTML = "Play";
        document.getElementById('cvtGray').style.visibility = 'hidden';
    }
    streaming = !streaming;
}

let src, dist, cap;

function cvtGray() {
    src = new cv.Mat(height, width, cv.CV_8UC4);
    cap = new cv.VideoCapture('video');
    setTimeout(process, 300);
}

let classes = {
    '0': '칠성사이다',
    '1': '스프라이트'
}


let identified = document.getElementById('identified')

async function process() {
    if (streaming === true) {
        cap.read(src);
        let rect = new cv.Rect(54, 0, 320, 320);
        dst = src.roi(rect);
        let test = new cv.Mat();
        cv.cvtColor(dst, test, cv.COLOR_RGBA2RGB);
        test = tf.tensor(test.data, [320, 320, 3]);


        //console.log(dst_tensor);
        //tf.loadGraphModel('./model/model.json').then(function (model){
        //console.log(model.predict(dst_tensor));
        //});
        //cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        //let rect = new cv.Rect(108, 0, 748, 640);
        //dst = dst.roi(rect);
        //cv.imshow('output', dst);
        //dst_tensor = tf.browser.fromPixels(document.getElementById('output'));
        //console.log(dst_tensor.sub(test).data());
        dst_tensor = test;
        dst_tensor = dst_tensor.expandDims(0);
        dst_tensor = dst_tensor.div(tf.scalar(255));
        //console.log(dst_tensor);
        tf.loadGraphModel('./model/model.json').then(function (model) {
            //console.log(model.predict(dst_tensor));
            pred = model.predict(dst_tensor).reshape([6300, 7]);
            box = pred.slice([0, 0], [6300, 4]);
            score = pred.slice([0, 4], [6300, 1]).reshape([6300]);
            cls = pred.slice([0, 5], [6300, 2]);
            cls = cls.argMax(1);
            xy_cal = tf.tensor2d([320, 0, 320, 0, 0, 320, 0, 320, -160, 0, 160, 0, 0, -160, 0, 160], [4, 4]);
            //console.log(conf)
            box = box.matMul(xy_cal);
            maxSup = tf.image.nonMaxSuppression(box, score, maxOutputSize = 1000, iouThreshold = 0.5, scoreThreshold = 0.25);
            box = box.dataSync();
            box = Array.from(box);
            cls = cls.dataSync();
            cls = Array.from(cls);
            //console.log(cls);
            xy_array = [];
            for (var i = 0; i < box.length; i += 4) {
                xy_array.push([box[i], box[i + 1], box[i + 2], box[i + 3]]);
            }
            maxSup = maxSup.dataSync();
            maxSup = Array.from(maxSup);

            cv.imshow('output', dst);
            if (maxSup.length === 0) {
                identified.innerHTML = '식별된 캔이 없습니다.';
            }
            for (i = 0; i < maxSup.length; i++) {
                x1 = parseInt(xy_array[maxSup[i]][0]);
                y1 = parseInt(xy_array[maxSup[i]][1]);
                x2 = parseInt(xy_array[maxSup[i]][2]);
                y2 = parseInt(xy_array[maxSup[i]][3]);

                ctx.drawImage(video, video.width / 2 - 160, video.height / 2 - 160, 320, 320, 0, 0, 320, 320)
                ctx.strokeStyle = 'red'; // 선 색
                ctx.lineWidth = 5 // px단위
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                if (maxSup.length === 1) {
                    identified.innerHTML = classes[cls[maxSup[i]]];
                } else if (maxSup.length === 2) {
                    identified.innerHTML = classes[0] + ', ' + classes[1];
                }

                console.log(cls[maxSup[i]]);
            }
            // let rect = new cv.Rect(x_mean - width/2 + 54, y_mean - height/2, width, height);
            // dst = src.roi(rect);
            // cv.imshow('output', dst);

            //console.log(box[maxSup[0]]);
            //output_tensor = model.predict(dst_tensor);
            //console.log(output_tensor);
        });
        setTimeout(process, 0);
    }
}