/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;
var littleVideo = false;

var gumVideo = document.querySelector('video#gum');
var statusV = document.getElementById('status');
//var recordedVideo = document.querySelector('video#recorded');
statusV.innerText = '准备阶段';

var recordButton = document.querySelector('button#record');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
var reStartButton = document.querySelector('button#reStart');
var uploadBtn = document.querySelector('button#upload');
var downloadVideo = document.querySelector('button#downloadVideo');
var downloadAudio = document.querySelector('button#downloadAudio');

recordButton.onclick = toggleRecording;
playButton.onclick = play;
reStartButton.onclick = restartRecord;
uploadBtn.onclick = upload;
downloadVideo.onclick = downVideo;
downloadAudio.onclick = downAudio;

// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === 'https:' ||
    location.hostname === 'localhost';
if (!isSecureOrigin) {
    alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
        '\n\nChanging protocol to HTTPS');
    location.protocol = 'HTTPS';
}

var constraints = {
    audio: true,
    video: true
};

function drawLittleVideo(c){
    var ctx=c.getContext('2d');
    //清除画布内容，重新画满
    ctx.clearRect(0,0,c.width,c.height);
    ctx.drawImage(gumVideo,320,0,80,60);
    //设置字体填充颜色
    ctx.font = "15px Courier New";
    ctx.strokeStyle  = "black";
    ctx.fillText('请做一个简单的自我介绍',100,150);
}

function drawBigVideo(c){
    var ctx=c.getContext('2d');
    //清除画布内容，重新画满
    ctx.clearRect(0,0,c.width,c.height);
    ctx.drawImage(gumVideo,0,0,c.width,c.height);
}

function handleSuccess(stream) {
    recordButton.disabled = false;
    console.log('getUserMedia() got stream: ', stream);
    window.stream = stream;
    if (window.URL) {
        //gumVideo.src = window.URL.createObjectURL(stream);
        gumVideo.srcObject = stream;
    } else {
        gumVideo.src = stream;
    }

    var c=document.getElementById("myCanvas");
    c.width = 400;
    c.height = 300;
    var i;
    gumVideo.addEventListener('play',function() {
        var p = document.createElement('p');
        p.innerText = 'hello';
        i=window.setInterval(function() {
            if(littleVideo){
                drawLittleVideo(c);
            }else{
                drawBigVideo(c);
            }
        },20);
    },false);
    gumVideo.addEventListener('pause',function() {if(i){window.clearInterval(i);}},false);
    gumVideo.addEventListener('ended',function() {if(i){clearInterval(i);}},false);
}

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).
then(handleSuccess).catch(handleError);

function handleSourceOpen(event) {
    console.log('MediaSource opened');
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
    console.log('Source buffer: ', sourceBuffer);
}

// recordedVideo.addEventListener('error', function(ev) {
//     console.error('MediaRecording.recordedMedia.error()');
//     alert('Your browser can not play\n\n' + recordedVideo.src
//         + '\n\n media clip. event: ' + JSON.stringify(ev));
// }, true);

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function handleStop(event) {
    console.log('Recorder stopped: ', event);
}

function toggleRecording() {
    if (recordButton.textContent === '录制' || recordButton.textContent === '重录') {
        littleVideo = false;
        recordButton.textContent = '停止';
        startRecording();
    } else {
        stopRecording();
        recordButton.textContent = '重录';
    }
}

function startRecording() {
    statusV.innerText = '答题阶段';
    //todo：显示录制中 提示
    recordedBlobs = [];
    var options = {mimeType: 'video/webm;codecs=vp9'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: 'video/webm;codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: 'video/webm'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options = {mimeType: ''};
            }
        }
    }
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
            + e + '. mimeType: ' + options.mimeType);
        return;
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    statusV.innerText = '答题结束，确认阶段';
    //影藏录制中提
    mediaRecorder.stop();
    console.log('Recorded Blobs: ', recordedBlobs);
    //recordedVideo.controls = true;
}

function play() {
    var superBuffer = new Blob(recordedBlobs, {type: 'video/mp4'});
    //recordedVideo.src = window.URL.createObjectURL(superBuffer);
    gumVideo.src = window.URL.createObjectURL(superBuffer);
}

//视频
function downVideo() {
    var blob = new Blob(recordedBlobs, {
        type: 'video/mp4'
    });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    //文件名 通过方法传进来 检测是否合法？
    a.download = 'bridge-plus.mp4';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}
//音频WAV
 function downAudio() {
    var blobAudio = new Blob(recordedBlobs, {
        'type': 'audio/ogg; codecs=opus'
    });

    var urlAudio = window.URL.createObjectURL(blobAudio);
    var a1 = document.createElement('a');
    a1.style.display = 'none';
    a1.href = urlAudio;
    a1.download = 'bridge-plus.wav';
    document.body.appendChild(a1);
    console.log('error document....');
    a1.click();
    setTimeout(function () {
        document.body.removeChild(a1);
        window.URL.revokeObjectURL(urlAudio);
    }, 100);
}


function upload(){
    //保存在本地，通过post请求
    //还可以用append方法添加一些附加信息参数为(name,value)，如下面的代码：
    //formData.append('nickName','Jack');//-->后台用req.body.nickName将值'Jack'取出
    var blob = new Blob(recordedBlobs, {type: 'video/mp4'});
    var data = new FormData();
    data.append('video', blob);
    data.append('qw', 123);
    data.append('question', 1);
    // var formData = new FormData();
    //
    // formData.append("username", "Groucho");
    // formData.append("accountnum", 123456); // 数字 123456 会被立即转换成字符串 "123456"
    //
    // // JavaScript file-like 对象
    // var content = '<a id="a"><b id="b">hey!</b></a>';
    // var blob = new Blob([content], { type: "text/xml"});
    //
    // formData.append("webmasterfile", blob);
    //
    // console.log(formData);

    $.ajax({
        type: "POST",
        url: "/form/data",
        data: data,
        processData:false,   //  告诉jquery不要处理发送的数据
        contentType:false,    // 告诉jquery不要设置content-Type请求头
        success:function(msg){
            console.log(msg);
        }
    });
}

function restartRecord(){
    //清楚存留 按钮功能重置
    recordButton.textContent = '录制';
    playButton.disabled = true;
    downloadButton.disabled = true;
    reStartButton.disabled = true;
    //handleSuccess();
    navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);
    statusV.innerText = '准备阶段';
}