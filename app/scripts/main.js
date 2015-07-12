/**
 *	移动端浏览器查看log
 */
//get the mobile device
(function(){
	var userAgent = navigator.userAgent.toLowerCase();
	window.device = {};
	device.isMobile     = _find("iphone") || _find("android");

	function _find(deviceNameInLowerCase){
		return userAgent.indexOf(deviceNameInLowerCase) !== -1;
	}
})();

// store all the consolelogs
var mLogger = "";
if(window.device.isMobile) {
	window.console.log = function(_log){
		var _now = new Date();
		mLogger = mLogger + "[" + _now.getSeconds()+","+_now.getMilliseconds() + "]" + _log.toString() + "<br /><br />";
	}
}

// print the consolelogs to the element
function fShowConsole() {
	if($("#logBlock")[0]) {
		return;
	}
	var logBlock = '<div id="logBlock" style="overflow: auto;position: absolute;z-index: 999999;left: 0;right: 0;top: 0;bottom: 0;box-sizing: border-box;padding: 20px;background: rgba(0,0,0,.9);color: #fff;"></div>'
	$('body').append(logBlock);
	$('#logBlock').html(mLogger);
	$('#logBlock').click(function() {
		$(this).remove();
	});
}

// show the element that mentioned above
$("body").on( "taphold", function() {
	// fShowConsole();
});


/**
 *	与服务器交互
 */
// 获取url有效信息
function fGetUrlQueryString(qstring) {
	var splitUrl = qstring.split("?");
	var strUrl = (splitUrl.length > 1) ? decodeURIComponent(splitUrl[1]).split("&") : [];
	var str = "";
	var obj = {};
	for (var i = 0, l = strUrl.length; i < l; i++) {
		str = strUrl[i].split("=");
		obj[str[0]] = str[1];
	}
	return Array.prototype.sort.call(obj);
}


var mQuizsIndex   = 0;  						//题目序号
var mQuizsLength  = QuizsCmn.length;			//题目数目
var mIsSelect     = false;						//是否选中选项
var mTempSelect   = null;						//当前选择
var mAnswers      = new Array(mQuizsLength);  	//答案数组
var mGrade        = 0;						  	//得分
var mResult       = null;						//结果概述
var mResultDetail = null;						//结果细节
var mfirstClick = true;							//是否是第一次点击查看测试结果

// 与微信有关变量
var mGameID = 2, 								//游戏序号
	mWXUid,	 									//玩家微信Id
	mWXNickname, 								//玩家微信昵称
	mWXHeadImgUrl,								//玩家头像链接
	mUrlParams,									//链接中的有效信息
	mWXCode,									//链接中的code信息，识别用户
	mGetUrlWXUid,								//链接中获取的用户ID
	mGetUrlWXName,                              //链接中获取的用户昵称
	mGetUrlWXImgUrl,                            //连接中获取的用户头像
	mGetUrlWXGrade;								//链接获取的用户得分

mUrlParams = fGetUrlQueryString(window.location.search);
mWXCode    = mUrlParams.code;	// required
console.log('WXCode: ' + mWXCode);
if(mUrlParams.wxuid){
	mGetUrlWXUid = mUrlParams.wxuid;
	console.log('GetUrlWXUid: ' + mGetUrlWXUid);	
}
if(mUrlParams.wxname){
	mGetUrlWXName = mUrlParams.wxname;
	console.log('GetUrlWXName: ' + mGetUrlWXName);	
}
if(mUrlParams.wxavatar){
	mGetUrlWXImgUrl = mUrlParams.wxavatar;
	console.log('GetUrlWXImgUrl: ' + mGetUrlWXImgUrl);	
}
if(mUrlParams.state){
	mGetUrlWXGrade = mUrlParams.state;
	console.log('GetUrlWXgrade: ' + mGetUrlWXGrade);	
}


$(function(){
	fWXInit();
});

function init(){
	// 重置参数
	resetVar();
	shareNoFinish();
	$('.wrap').hide();
	genQuizs(mQuizsIndex);	
	
	//按钮绑定
	// 开始游戏按钮绑定事件
	$('.beginBtn').tap(function(){
		$('#beginTest').hide();
		$('#mainTest').show();
		return false;		
	});

	//选项按钮
	$('.chooseBtn').tap(function(){
		$(this).siblings().css('backgroundColor', '#feeeee');
		$(this).css('backgroundColor', '#fed559');

		mIsSelect = true;
		mGrade = 0;
		mfirstClick = true;
		mTempSelect = $(this).attr('id').substr(-1,1);
		mAnswers[mQuizsIndex - 1] = mTempSelect;
		console.log(mTempSelect);
	});

	//下一题按钮绑定事件。查看结果事件绑定在最后一题上
	$('#nextQue').tap(nextQuiz);
	// 上一题绑定事件
	$('#preQue').tap(preQuiz);
	$('#guideShare').tap(function(){
		$(this).hide();
	});
	
	//重新测试按钮
	$('#restartTestBtn').tap(function(){
		$('#resultTest').hide();
		resetVar();
		genQuizs(mQuizsIndex);
		$('#mainTest').show();
		return false;
	});

}

// 参数重置
function resetVar(){
	mQuizsIndex   = 0;
	mQuizsLength  = QuizsCmn.length;
	mIsSelect     = false;
	mTempSelect   = null;
	mAnswers      = ['null', 'null', 'null', 'null', 'null', 'null', 'null', 'null', 'null', 'null']
	mGrade        = 0;
	mResult       = null;
	mResultDetail = null;
	// 避免多次算分
	mfirstClick = true;
	// 进度条
	$('.proBarIn').hide();
	$('#proBar1').show();
	// 按钮
	$('#nextQue').text('下一题');
	$('#nextQue').removeClass('js_stock_restartBtn');
	$('#nextQue').addClass('js_stock_normalBtn');
	$('.chooseBtn').removeClass('animated shake');
}

//下一题按钮
function nextQuiz(){
	$(this).blur();
	$('.chooseBtn').css('backgroundColor', '#feeeee');
	if(mIsSelect){
		if(mQuizsIndex < mQuizsLength - 1){
			// 前八题
			mTempSelect = null;
			mIsSelect = false;
			genQuizs(mQuizsIndex);
		}
		else if(mQuizsIndex < mQuizsLength)
		{
			// 第九题，修改按钮样式
			console.log(mAnswers);
			genQuizs(mQuizsIndex);
			mTempSelect = null;
			mIsSelect = false;
			$(this).text('查看结果');
			$(this).removeClass('js_stock_normalBtn');
			$(this).addClass('js_stock_restartBtn');
		}
		else{
			//最后一题，点击完成,根据得分活的测试结果
			simuGrade();
			console.log("grade:" + mGrade);
			console.log(mAnswers); 
			console.log('share');
			$('#guideShare').show();
			getResult(mWXNickname, mGrade);
			share2Frd(mWXUid, mWXNickname, mWXHeadImgUrl, mGrade, mResult);		
		}
	}
	else{
		// 未选择就点击下一题
		$('.chooseBtn').addClass('animated shake');
	}
	return false;
}

// 上一题按钮
function preQuiz(){
	$(this).blur();
	$('.chooseBtn').css('backgroundColor', '#feeeee');
	if(mQuizsIndex > 1){
		mQuizsIndex -= 2;
		genQuizs(mQuizsIndex);
		if(mQuizsIndex == 9){
			$('#nextQue').text('下一题');
			$('#nextQue').removeClass('js_stock_restartBtn');
			$('#nextQue').addClass('js_stock_normalBtn');	
			console.log(mQuizsIndex);
		}						
	}
	else{
		// 当前第一题
		mIsSelect = false;
		$('.chooseBtn').addClass('animated shake');
	}
};



//刷新问题
function genQuizs(i){	
	mIsSelect = false;	
	$('.chooseBtn').removeClass('animated shake');
	var newQuiz = QuizsCmn.slice(i,i+1);
	var quizContent = newQuiz[0]['text'],
	quizChooseA = newQuiz[0]['answers'][0];
	quizChooseB = newQuiz[0]['answers'][1];
	quizChooseC = newQuiz[0]['answers'][2];
	quizChooseD = newQuiz[0]['answers'][3];
	//console.log(quizContent);
	mQuizsIndex = newQuiz[0]['seq'];

	$('.queContent').text(quizContent);
	$('#chooseBtnA').text(quizChooseA);
	$('#chooseBtnB').text(quizChooseB);
	$('#chooseBtnC').text(quizChooseC);
	$('#chooseBtnD').text(quizChooseD);
	$('#proBar' + (i+1)).show();
	$('#proBar' + (i+2)).hide();
	$('.barText').text((i+1) + '/10');
	return false;
}

// 计算得分
function simuGrade(){
	if(mfirstClick){
		for(var i = 0; i < mAnswers.length; i++){
		mGrade += mapGrade(i, mAnswers[i]);
		}
		mfirstClick = false;
	}
}

//选项对应得分
function mapGrade(i, selection){
	switch(i){
		case 0: case 1: case 2: case 3:
			switch(selection){
				case 'A':
					return 1;
					break;
				case 'B':
					return 2; 
					break;
				case 'C':
					return 3;
					break;
				case 'D':
					return 4;
					break;
			}
		break;
		case 4:
			switch(selection){
				case 'A':
					return 1;
					break;
				case 'B':
					return 3; 
					break;
				case 'C':
					return 4;
					break;
				case 'D':
					return 2;
					break;

			}
		break;
		case 5: case 6:
			switch(selection){
				case 'A':
					return 4;
					break;
				case 'B':
					return 3; 
					break;
				case 'C':
					return 2;
					break;
				case 'D':
					return 1;
					break;
			}
		break;
		case 7: case 9:
		switch(selection){
				case 'A':
					return 4;
					break;
				case 'B':
					return 2; 
					break;
				case 'C':
					return 3;
					break;
				case 'D':
					return 1;
					break;
			}
		break;
		case 8:
		switch(selection){
				case 'A':
					return 3;
					break;
				case 'B':
					return 2; 
					break;
				case 'C':
					return 4;
					break;
				case 'D':
					return 1;
					break;
			}
		break;
	}
	return mGrade;
}

//根据得分计算测试结果
function getResult(nickname, _grade){
	if(_grade <= 17){
		mResult = ResultCmn[0]['sum'];
		mResultDetail = ResultCmn[0]['detail'];
		var tempUrl = ResultCmn[0]['url'];
		$('.resultIMG').attr({"src": tempUrl});
	}
	else if(_grade <= 23){
		mResult = ResultCmn[1]['sum'];
		mResultDetail = ResultCmn[1]['detail'];
		var tempUrl = ResultCmn[1]['url'];
		$('.resultIMG').attr({"src": tempUrl});
	}
	else if(_grade <= 30){
		mResult = ResultCmn[2]['sum'];
		mResultDetail = ResultCmn[2]['detail'];
		var tempUrl = ResultCmn[2]['url'];
		console.log(tempUrl);
		$('.resultIMG').attr({"src": tempUrl});
	}
	else if(_grade <= 35){
		mResult = ResultCmn[3]['sum'];
		mResultDetail = ResultCmn[3]['detail'];
		var tempUrl = ResultCmn[3]['url'];
		$('.resultIMG').attr({"src": tempUrl});
	}
	else if(_grade <= 38){
		mResult = ResultCmn[4]['sum'];
		mResultDetail = ResultCmn[4]['detail'];
		var tempUrl = ResultCmn[4]['url'];
		$('.resultIMG').attr({"src": tempUrl});
	}
	else{
		mResult = ResultCmn[5]['sum'];
		mResultDetail = ResultCmn[5]['detail'];
		var tempUrl = ResultCmn[5]['url'];
		$('.resultIMG').attr({"src": tempUrl});
	}
	console.log(mResult);
	console.log(mResultDetail);
	$(".resultDetaiTxt").text('经测试' + nickname + mResult + mResultDetail);
}


//请求 返回

function fWXInit(){
	var postData = {
		"var": {
			"gameId": mGameID,
			"code": mWXCode
		}
	}
	$.ajax({
		url: 'http://h5.iorcas.com/h5/jsapi/wx?func=game:init',
		type: 'POST',
		dataType: 'json',
		data: JSON.stringify(postData),
		contentType: "application/json",
		success:function(jData){
			if (jData.code == "S_OK"){
				mWXUid = jData.var.wxUser.wxUid; //标示
				mWXNickname = jData.var.wxUser.nickname; //昵称
				mWXHeadImgUrl = jData.var.wxUser.headimgurl; //头像
				fWXConfig();

				if(mGetUrlWXUid && mGetUrlWXName && mGetUrlWXImgUrl) {
					// url带wxuid，直接跳转到结果页
					getResult(mGetUrlWXName, mGetUrlWXGrade);
					share2Frd(mGetUrlWXUid, mGetUrlWXName, mGetUrlWXImgUrl, mGetUrlWXGrade, mResult);

					$('#resultTest').show();
					$('.photo').attr({"src": mGetUrlWXImgUrl});
					var restartTestBtn = $('#restartTestBtn');
					if(mWXUid != mGetUrlWXUid) {
						restartTestBtn.text('测测我的炒股潜能');
					}
					restartTestBtn.tap(function(){
						init();
						$('#mainTest').show();
						$(this).text('重新测试');
						return false;
					});
				}
				else {
					// url中无wxuid，重新开始
					init();
					$('#beginTest').show();
				}

			}
			else {
				console.log('GameInit jData.code: ' + jData.code);
			}	
		},
		error: function() {
			console.log('init error');
		}
	});
}

/**
 *	微信分享相关
 */
// 通过config接口注入权限验证配置
function fWXConfig() {
	var signUriParams = location.pathname + (location.search && "" != location.search ? location.search : "");
	var signUrl = 'http://h5.iorcas.com/h5/jsapi?type=wx&uri=' + encodeURIComponent(signUriParams);
	$("head").append("<script src='" + signUrl + "'></script>");
}

function fWXShareContent(DataApp, DataTime){
    
    wx.ready(function(){

    	wx.checkJsApi({
	      jsApiList: [
	        'onMenuShareAppMessage',
	        'onMenuShareTimeline'
	      ],
	      success: function (res) {
	        console.log(JSON.stringify(res));
	      }
	    });

	    console.log('title: ' + DataApp.title + '<br />desc: ' + DataApp.desc + '<br />link: ' + DataApp.link);
		wx.onMenuShareAppMessage(DataApp); //分享给好友
		wx.onMenuShareTimeline(DataTime);  //分享到朋友圈
    });

    wx.error(function() {
    	console.log('ready error');
    });

}

//分享给好友按钮
function share2Frd(wxuid, nickname, sImgUrl, grade, _result){
	var shareDesc = "经测试" + nickname + _result + "，你的炒股潜能有多强？来测测看吧！"
	var shareUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx5ab2bd8ff19f4788&redirect_uri=http%3A%2F%2Fh5.iorcas.com%2Fhd%2Fstocktest%2Fapp%2Fhtml%2Findex.html%3Fwxuid=' + wxuid + '%26wxname=' + nickname + '%26wxavatar=' + encodeURIComponent(sImgUrl) + '&response_type=code&scope=snsapi_userinfo&state=' + grade + '#wechat_redirect';
	console.log('sharelink'+shareUrl);

	var shareDataApp = {
	    title: '测测你的炒股潜能',// 分享标题
		desc: shareDesc,
		link: shareUrl,
		imgUrl: sImgUrl,
		success: function(){
			$('#mainTest').hide();
			$('#guideShare').hide();
		    $("#resultTest").show();
			$('.photo').attr({"src": sImgUrl});
			shareSuccess();
		},
		cancel: function(){

		}
	};
	var shareDataTime = {
		title: shareDesc,
		link: shareUrl,
		imgUrl: sImgUrl,
		success: function(){
			$('#mainTest').hide();
			$('#guideShare').hide();
		    $("#resultTest").show();
			$('.photo').attr({"src": sImgUrl});
			shareSuccess();
		},
		cancel: function(){

		}
	};

	fWXShareContent(shareDataApp, shareDataTime);
}
//题目未完成时分享
function shareNoFinish(){
	var shareDesc = "你的炒股潜能有多强？来测测看吧！";
	var shareUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx5ab2bd8ff19f4788&redirect_uri=http%3A%2F%2Fh5.iorcas.com%2Fhd%2Fstocktest%2Fapp%2Fhtml%2Findex.html%3F&response_type=code&scope=snsapi_userinfo&state=0#wechat_redirect';
	var shareImgUrl = "http://static.iorcas.com/tuiguang/20150627_stock/images/icon_share.png"    

    var shareDataApp = {
        title: '测测你的炒股潜能',// 分享标题
    	desc: shareDesc,
    	link: shareUrl,
    	imgUrl: shareImgUrl,
    	success: function(){
    		console.log('success');
    		shareSuccess();
    	},
    	cancel: function(){

    	}
    };
    var shareDataTime = {
    	title: shareDesc,
    	link: shareUrl,
    	imgUrl: shareImgUrl,
    	success: function(){
    		console.log('success');
    		shareSuccess();
    	},	
    	cancel: function(){

    	}
    };

    fWXShareContent(shareDataApp, shareDataTime);
}

// 分享成功统计
function shareSuccess(){
	$.ajax({
		type: "GET",
		url: "http://h5.iorcas.com/h5/jslog?t=stocktest&a=wx_timeline"
	});
}


$(window).bind('load', function() {
	//设置文档高度
	var winHeight = $(window).height();
	if(winHeight == $(document).outerHeight()) {
		var beginTestMidHeight = winHeight - $('.js_beginTestTop').height() - $('.js_beginTestBot').height();
		$('.js_beginTestMid').css('height', beginTestMidHeight);
	}
});




