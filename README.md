[Angit]: https://google.com "AnHye0n Github"
[Kimgit]: https://github.com/Delta-Life "Kim Github"

# 팀원
- [안정현][Angit]
- [김일중][Kimgit]

# 프로젝트 소개

**시각장애인을 위한 캔 음료 음성안내 앱**

추후 여러 물건들을 인식하는 종합 플랫폼으로 개발될 예정

# 작동 방식
![설명](https://user-images.githubusercontent.com/49294599/131503364-723fa454-690c-4a40-bec5-fdd65f60e6dd.png)


# 프로젝트(코드) 사용법

[https://github.com/ultralytics/yolov5](https://github.com/ultralytics/yolov5)를 참고하여 사용하고자 하는 custom yolov5 모델을 제작한다.

[https://github.com/zldrobit/yolov5.git](https://github.com/zldrobit/yolov5.git)를 침고하여 yolov5 모델을 tensorflow 모델으로 변환한다.

```python
!python models/tf.py --weights weights/best.pt --cfg models/yolov5s.yaml --img 320
!tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_node_names='/Reshape_1' \
    --saved_model_tags=serve \
    /path/to/saved_model \
    /path/to/converted_model
```

명령어를 이용하여 tensorflow 모델을 tensorflow.js 모델으로 변환한다.

이 repository를 clone하여 model 폴더 안에 tensorflow.js 모델을 넣는다.

변환된 모델의 class의 개수와 class 명에 따라 tensor/video.js의 clses값과 classes의 class 명을 수정한다.

class 명을 읽어주는 tts파일을 준비하여 audio 폴더에 audio_num.mp3형태로 준비한다.

JS autoplay 기능이 IOS 및 Safari 브라우저 에서 호환이 안되는 경우가 있어 스마트폰 화면 아래를 터치(버튼)하면 소리가 재생되는 걸로 수정

## 참고사항
- 초기엔 tts서비스를 이용하였지만, 각종 기기와 환경에 적용하기에 무리가 있어 audio폴더 안에 소리를 재생하는 것으로 함
    - Ex) 0번째 클래스를 인식할 경우 audio_0.mp3가 재생됨.

# tensorflow.js를 사용하여 웹페이지를 만든 이유

javascript를 이용하여 제작되어 client에서 직접 인공지능 연산을 하게 되므로 서버의 성능에 영향을 받지 않으며, 이미지 정보에 대한 보안 문제도 해결할 수 있다. 그 외에도, 웹페이지에서 인공지능 연산을 수행하므로, web view를 이용한 안드로이드, IOS 애플리케이션으로 활용이 쉽다.
