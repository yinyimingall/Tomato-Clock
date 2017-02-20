$(document).ready(function() {
      $('.clockpicker').clockpicker();
});
$(document).ready(function() {
  var processFlag = false;

  var numberInfoObj = {
    counts: 0,
    short: 0,
    long: 0
  }
  var timeInfoObj = {
    worktime: 0,
    shorttime: 0,
    longtime: 0
  }

  var workTimeInterval, shortTimeInterval, longTimeInterval;

  var tomatoCountState, workTimeState, shortTimeState, longTimeState;

  var $tomatoCount = $('#tomato-number');
  var $workTime = $('#work-period');
  var $shortTime = $('#short-rest');
  var $longTime = $('#long-rest');

  var $eyeCare = $('#eyecare');
  var $tomatoState = $('#tomato-state');

  var tomatoStorage = {

  }

  chrome.storage.local.get(null, function(result){
    if(!$.isEmptyObject(result)) {
      console.log('有storage');
      console.log(result);
      tomatoCountState = result.tomato_number;
      workTimeState = result.work_time*60;
      shortTimeState = result.short_rest*60;
      longTimeState = result.long_rest*60;
      audioArray = result.audioArr;
      audioSwitchArray = result.isAudioItems;
      drinkCheckArray = result.drinklist;
      showCountdown(workTimeState);
      audioResetView();
      audioResetButton();
      drinkResetView();
      $tomatoCount.val(tomatoCountState);
      $workTime.val(workTimeState/60);
      $shortTime.val(shortTimeState/60);
      $longTime.val(longTimeState/60);

      eyeTimeState = result.eye_care * 60;
      $eyeCare.val(result.eye_care);
    } else {
      console.log('初始设置');
      tomatoCountState = $tomatoCount.val();
      workTimeState = $workTime.val()*60;
      shortTimeState = $shortTime.val()*60;
      longTimeState = $longTime.val()*60;
      eyeTimeState = $eyeCare.val()*60;
      audioSwitchArray = [true, true, true, true, true];
      audioArray = [7,3,11,0,2];
      getDrinkList();
      tomatoStorage = {
        tomato_number : tomatoCountState,
        work_time : workTimeState/60,
        short_rest : shortTimeState/60,
        long_rest : longTimeState/60,
        isAudioItems : [true, true, true, true, true],
        audioArr : audioArray,
        eye_care : eyeTimeState/60,
        drinklist : drinkCheckArray
      }

      chrome.storage.local.set( tomatoStorage, function(){
        console.log('storage complited')
      });

    }
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
         for (key in changes) {
           var storageChange = changes[key];
           console.log('Storage key "%s" in namespace "%s" changed. ' +
                       'Old value was "%s", new value is "%s".',
                       key,
                       namespace,
                       storageChange.oldValue,
                       storageChange.newValue);
         }
  });

  var $navSeleting = $('header nav ul li');
  var $section = $('main > div');
  $navSeleting.bind("click", function(event){
    $(this).siblings('li').find('a').removeClass('nav-selected');
    $(this).find('a').addClass('nav-selected');
    $section.hide();
    $section.eq( $(this).index() ).show();
  });

  var $configSeleting = $('#configure nav ul li');
  var $configSection = $('#configure > div');
  $configSeleting.bind("click", function(event){
    $(this).siblings('li').find('a').removeClass('config-selected');
    $(this).find('a').addClass('config-selected');
    $configSection.hide();
    $configSection.eq( $(this).index() ).show();
  });

// 当前信息显示
var $messageFinished = $('#message-finished');
var $messageNember = $('#message-number');
var $thTomato = $('#th-tomato');
var $thShort = $('#th-short');
var $thLong = $('#th-long');
var $tdWorktime = $('#td-worktime');
var $tdShorttime = $('#td-shorttime');
var $tdLongtime = $('#td-longtime');
var $totalTime = $('#total-time');
function showMessage(){
  $messageFinished.html((numberInfoObj.counts/tomatoCountState).toFixed(2));
  $messageNember.html(tomatoCountState);
  $thTomato.html(numberInfoObj.counts);
  $thShort.html(numberInfoObj.short);
  $thLong.html(numberInfoObj.long);

var transfer = function(time, res){
    var hour, minute;
    time = time/60;
    hour = parseInt( time/60);
    minute = Math.ceil(time % 60);
    if(res === 0){
      return hour;
    } else if (res === 1) {
      return minute;
    }
  }
  var total = timeInfoObj.worktime+timeInfoObj.shorttime+timeInfoObj.longtime;
  $tdWorktime.html(transfer(timeInfoObj.worktime, 0)+'<span class="td-color">小时</span>'+transfer(timeInfoObj.worktime, 1)+'<span class="td-color">分钟</span>');
  $tdShorttime.html(transfer(timeInfoObj.shorttime, 0)+'<span class="td-color">小时</span>'+transfer(timeInfoObj.shorttime, 1)+'<span class="td-color">分钟</span>');
  $tdLongtime.html(transfer(timeInfoObj.longtime, 0)+'<span class="td-color">小时</span>'+transfer(timeInfoObj.longtime, 1)+'<span class="td-color">分钟</span>');
  $totalTime.html(transfer(total, 0) + '<span class="td-color">小时</span>' +transfer(total, 1) + '<span class="td-color">分钟</span>');
}
/*---------------*/
var messageInterval;
$('#start-button').bind("click", function(){
  if(processFlag == true) {
    processFlag = false;
    $(this).removeClass('convert-button a').find('a').text('开始');
  } else {
    processFlag = true;
    $(this).addClass('convert-button a').find('a').text('停止');
  }
  if(processFlag) {
    process();
    messageInterval = setInterval(function(){
      showMessage();
    }, 60000);
  } else {
    numberInfoObj.counts = 0;
    if(workTimeInterval)  clearInterval(workTimeInterval);
    if(shortTimeInterval)  clearInterval(shortTimeInterval);
    if(longTimeInterval)  clearInterval(longTimeInterval);
    clearInterval(messageInterval);
    $('#countdown').css('color', 'black');
    showCountdown(workTimeState);
    $tomatoState.html("无番茄");
  }
});


$('#clock-config input').change( function(){
  var tomatoCountValue = parseInt( $('#tomato-number').val());
  var longBreakTimeValue = parseInt( $('#long-rest').val());
  var shortBreakTimeValue = parseInt( $('#short-rest').val());
  var workTimeValue = parseInt( $('#work-period').val());

  var saveObj = {
    tomato_number : tomatoCountValue,
    work_time : workTimeValue,
    short_rest : shortBreakTimeValue,
    long_rest : longBreakTimeValue
  };
  chrome.storage.local.set(saveObj, function(){
    chrome.storage.local.get(saveObj, function(result){
      tomatoCountState = result.tomato_number;
      workTimeState = result.work_time * 60;
      shortTimeState = result.short_rest * 60;
      longTimeState = result.long_rest * 60;
      console.log('时钟设置已储存');
      showCountdown(workTimeState);

    });
  });

});



var $selectList = $('.notify-select');
var audioArray = new Array();
$selectList.each(function(index, el) {
  audioArray[index] = $(this).val();
});

$('.notif-item select').change(function(event) {
  $selectList.each(function(index, el) {
    audioArray[index] = $(this).val();
    console.log('元素' + audioArray[index]);
  });

var audio = {
  audioArr : audioArray
};
chrome.storage.local.set( audio, function(){
  chrome.storage.local.get( audio, function(result) {
    audioArray = result.audioArr;

    for(var i = 0; i < audioArray.length; i++) {
      console.log(audioArray[i] + ' :数字对应html里audio的声音');

    }
  });
  console.log('提醒声音已储存');
});
  console.log('select改变了');

});

var $notifyAudioReset = $('.notif-item');
var audioResetStateArray = [7,3,11,0,2];
function audioResetView(){
  $notifyAudioReset.find("select[name='work'] option").eq(audioArray[0]).prop('selected', true);
  $notifyAudioReset.find("select[name='shortrest'] option").eq(audioArray[1]).prop('selected', true);
  $notifyAudioReset.find("select[name='longrest'] option").eq(audioArray[2]).prop('selected', true);
  $notifyAudioReset.find("select[name='eyecare'] option").eq(audioArray[3]).prop('selected', true);
  $notifyAudioReset.find("select[name='drink'] option").eq(audioArray[4]).prop('selected', true);
}

$('#reset1').bind("click", function(){
  $notifyAudioReset.find("select[name='work']").find("option[value='7']").prop('selected', true);
  $notifyAudioReset.find("select[name='shortrest']").find("option[value='3']").prop('selected', true);
  $notifyAudioReset.find("select[name='longrest']").find("option[value='11']").prop('selected', true);
  $notifyAudioReset.find("select[name='eyecare']").find("option[value='0']").prop('selected', true);
  $notifyAudioReset.find("select[name='drink']").find("option[value='2']").prop('selected', true);
  var audio = {
    audioArr : audioResetStateArray
  };
  chrome.storage.local.set( audio, function(){
    chrome.storage.local.get( audio, function(result) {
      audioArray = result.audioArr;
    });
  });
});

var $audioSwitch = $('.audio-switch');

function audioResetButton(){
  $audioSwitch.each(function(index, el){
    if(audioSwitchArray[index]){
      $(this).prop("checked", true);
    } else{
      $(this).prop("checked", false);
    }
  });
}
$audioSwitch.bind("click", function(){
  $audioSwitch.each(function(index, el) {
    if( $(this).is(":checked")){
      audioSwitchArray[index] = true;
    } else {
      audioSwitchArray[index] = false;
    }
    console.log(audioSwitchArray[index]+'....'+index);
  });
  var isAudioStorage = {
    isAudioItems: audioSwitchArray
  }
  chrome.storage.local.set( isAudioStorage, function(){
    chrome.storage.local.get( isAudioStorage, function(result) {
      audioSwitchArray = result.isAudioItems;
    });
  });

});

var eyeSwitchState = false;
var $eyeSwitch = $('#eye-button');
$eyeSwitch.bind("click", function(){
  if($(this).is(':checked')) {
    eyeSwitchState = true;
  } else {
    eyeSwitchState = false;
  }
  if(eyeSwitchState) {
    eyecareProcess();
  } else {
    clearInterval(eyeTimeInterval);
  }
});

var eyeTimeInterval;

var eyeTimeState = parseInt( $eyeCare.val()) * 60;

$eyeCare.change(function(event) {

  var eyeStorage = $eyeCare.val();
  chrome.storage.local.set( {'eye_care' : eyeStorage}, function(){

  });
  eyeTimeState = parseInt(eyeStorage) * 60;
});

var drinkSwitch = $('#drink-button');
var drinkSwitchState = false;
drinkSwitch.bind("click", function(){
  if($(this).is(':checked')) {
    console.log('喝水选中的');
    drinkSwitchState = true;
  } else {
    drinkSwitchState = false;
  }
  if(drinkSwitchState) {
    drinkProcess();
  } else {
    clearInterval(drinkTimeInterval);
  }
});

var $drinkInputList = $('.form-control');
var drinkInput = $('.clockpicker input');
var drinkCheckArray = new Array();

function drinkResetView(){
  var arr = new Array();
  var st, end;
  console.log(drinkCheckArray)
  for( v in drinkCheckArray){
    if (drinkCheckArray.hasOwnProperty(v)) {

      st = drinkCheckArray[v].substring(0, 2);
      end = drinkCheckArray[v].substring(2, 4);
      arr[v] = st + ':' + end;
    }
  }
  $drinkInputList.each(function(index, el){
    $(this).val(arr[index]);
  });

}


function getDrinkList(){
  var arr = new Array();
  $drinkInputList.each(function(index, el) {
    arr[index] = $(this).val();
  });

  var st, end;
  for (var v in arr) {
    if (arr.hasOwnProperty(v)) {
      st = arr[v].substring(0, 2);
      end = arr[v].substring(3, 5);
      arr[v] = st + end;
    }
  }
  drinkCheckArray = arr;
}
drinkInput.change(function(event) {
  console.log('喝水设置改变了');
  getDrinkList();
  var drinkArrayStorage = {
    drinklist : drinkCheckArray
  }
  chrome.storage.local.set( drinkArrayStorage, function(){
    chrome.storage.local.get( drinkArrayStorage, function(result) {
      drinkCheckArray = result.drinklist;
    });
  });
});

var drinkTimeInterval;
function drinkProcess(){
  drinkTimeInterval = setInterval(function(){
    var drinkDate = new Date();
    var hours = drinkDate.getHours();
    var minutes = drinkDate.getMinutes();
    console.log(hours+minutes+ '时钟相加');
    console.log(hours + ':' + minutes);
    for (var v in drinkCheckArray) {
      if (drinkCheckArray.hasOwnProperty(v)) {
        if (drinkCheckArray[v] == (hours * 100 + minutes)) {
          console.log(hours + ':' + minutes + '喝水到');
          playAduio(4, audioArray, audioSwitchArray[4]);
          drinkNotify();
        }
      }
    }
  }, 60000);
}

function process() {
  if(processFlag) {
    timeColor(true);
    var workTime = workTimeState;
    var shortTime = shortTimeState;
    var longTime = longTimeState;
    playAduio(0, audioArray, audioSwitchArray[0]);
    workTimeNotify();
    tomatoState(0);
    var itemFlag = false;
    numberInfoObj.counts++;
    console.log('numberInfoObj.counts = ' + numberInfoObj.counts);
    showMessage();
      workTimeInterval = setInterval(function(){
      console.log('工作时间');
        workTime--;
        timeInfoObj.worktime++;
        showCountdown(workTime);
        if(workTime == 0 && numberInfoObj.counts % tomatoCountState != 0) {
          numberInfoObj.short++;
          timeColor(false);
          playAduio(1, audioArray, audioSwitchArray[1]);
          shortRestNotify();
          tomatoState(1);
          clearInterval(workTimeInterval);
          shortTimeInterval = setInterval(function(){
            console.log('短时间');
            shortTime--;
            timeInfoObj.shorttime++;
            showCountdown(shortTime);
            if(shortTime == 0) {
              itemFlag = true;
              clearInterval(shortTimeInterval);
              if(itemFlag) {
                process();
              }
            }
          },1000);
        }
        if (workTime == 0 && numberInfoObj.counts % tomatoCountState == 0) {
          numberInfoObj.long++;
          timeColor(false);
          playAduio(2, audioArray, audioSwitchArray[2]);
          longRestNotify();
          tomatoState(2);
          clearInterval(workTimeInterval);
          longTimeInterval = setInterval(function(){
            console.log('长休息时间');
            longTime--;
            timeInfoObj.longtime++;
            showCountdown(longTime);
            if(longTime == 0) {
              itemFlag = true;
              clearInterval(longTimeInterval);
              if(itemFlag) {
                process();
              }
            }
          }, 1000);
        }
      },1000);
  }
}

function eyecareProcess() {
  console.log('保护眼睛');
  var eyeTime = eyeTimeState;
  eyeTimeInterval = setInterval(function(){
    console.log("eye eyeTime = " + eyeTime);
    eyeTime--;
    if (eyeTime == 0) {
      playAduio(3, audioArray, audioSwitchArray[3]);
      eyecareNotify();
      clearInterval(eyeTimeInterval);
      eyecareProcess();
    }
  }, 1000);
}

function playAduio(index, array, isPlay){
  if(isPlay){
    var k = parseInt(array[index]);
    var audio = $('audio');
    audio[k].play();
  }
}

function timeColor(colorFlag) {
  if(colorFlag) {
    $('#countdown').css('color','rgb(31, 51, 116)');
  } else{
    $('#countdown').css('color','green');
  }
}
function workTimeNotify() {
  chrome.notifications.create('workreminder', {
    type: 'basic',
    title: '学习工作啦！',
    iconUrl: 'assets/picture/work.jpg',
    message: '打起精神，开始学习工作！'
  });
}
function shortRestNotify() {
  chrome.notifications.create('shortrestreminder', {
    type: 'basic',
    title: '短休息',
    iconUrl: 'assets/picture/tea-cup.png',
    message: '工作时间结束，小小休息一下儿！'
  });
}

function longRestNotify() {
  chrome.notifications.create('longrestreminder', {
    type: 'basic',
    title: '长休息',
    iconUrl: 'assets/picture/rest.png',
    message: '工作时间结束，开启一段长休息！'
  });
}

function eyecareNotify() {
  chrome.notifications.create('eyecarereminder', {
    type: 'basic',
    title: '眼睛要好好保养',
    iconUrl: 'assets/picture/medical.png',
    message: '适当休息按摩眼睛，眼睛才会更漂亮！'
  });
}

function drinkNotify(){
  chrome.notifications.create('drinkreminder', {
    type: 'basic',
    title: '快去喝杯水吧',
    iconUrl: 'assets/picture/drink.png',
    message: '人体需要水分进行各类身体运动，快去补水吧！'
  });
}


function tomatoState(state){
  switch(state){
    case 0:
      $tomatoState.html("工作中");
      break;
    case 1:
      $tomatoState.html("短休息");
      break;
    case 2:
      $tomatoState.html("长休息");
      break;
  }
}

function showCountdown( time ) {
  var minutes = parseInt(time / 60);
  var seconds = time % 60;
  $('#countdown').text(checkTime(minutes) + ':' + checkTime(seconds) );
}

function checkTime(time) {
  if( time < 10) {
    time = '0' + time;
  }
  return time;
}


});
