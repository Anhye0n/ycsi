const test_img = document.getElementById("crop_test");
const test_canvas = document.getElementById('crop_canvas');

const test_ctx = test_canvas.getContext('2d');

test_canvas.width = 500;
test_canvas.height = 500;

function draw() {
    test_img.style.visibility = "visible";

    let test_img_width = test_img.clientWidth
    let test_img_heigth = test_img.clientHeight

    test_ctx.drawImage(test_img, test_img_width/2 - 250,test_img_heigth/2 - 250,500,500,0,0,500,500)
}
