var tl = new TimelineMax();
var tl1 = new TimelineMax();
var tl2 = new TimelineMax();
var tl3 = new TimelineMax();

const socket = io('https://node.xbn.fm/overlay');

var newData;
var currentData = {
		mode: 'other',
		text_event_title: '',
		text_segment_title: '',
		text_metadata: '',
		show_event_title: false,
		show_segment_title: false,
		show_clock: false,
		show_metadata: false,
		metadata_np: false,
};

var marqueeOptions = {
		delayBeforeStart: 3000,
		gap: 100,
		duplicated: true,
		startVisible: true,
		pauseBeforeCycle: true,
		speed: 25,
};

var visible = false;
var firstRun = true;
var mwidth = "";
var mini = false;
var miniInUse = false;
var marqueeStopStart;
var nowPlaying = "This is XBN";

var newAnimation = false;

function updateText(className, text) {
	if(visible == true) {
		// Graphics are visible here, so need to animate _before_ we update the text.
		switch(className) {
			case "text_event_title":
				if(mini == false) {
					tl1.to(".lower-third.event .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0, onComplete: function () {
						// Reset text position to the right
						tl1.to(".lower-third.event .text",0,{ marginLeft: "2.5vw" });
						// Set Text
						$(".lower-third.event .text").html(text);
						// Calculate width of text to resize box.
						var width = (60+parseInt($(".lower-third.event .text").width()))+"px";
						// Animate again
						tl1.to(".lower-third.event",0.5,{ ease: CubicBezier.config(0.4,0,0.2,1), width: width });
						tl1.to(".lower-third.event .text",0.5,{ ease: Circ.easeOut, marginLeft: "0", opacity: 1 });
					} });
				} else {
					tl1.to(".lower-third.event .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0, onComplete: function () {
						// Reset text position to the right
						tl1.to(".lower-third.event .text",0,{ marginLeft: "2.5vw" });
						// Set Text
						$(".lower-third.event .text").html(text);
						// Calculate width of text to resize box.
						var width = (60+parseInt($(".lower-third.event .text").width()))+"px";
						var offsetWidth = (60+parseInt($(".lower-third.event .text").width()))+18+"px";
						// Animate again
						tl1.to(".lower-third.event",0.5,{ ease: CubicBezier.config(0.4,0,0.2,1), width: width });
						tl1.to(".lower-third.metadata",0.5,{ ease: CubicBezier.config(0.4,0,0.2,1), marginLeft: offsetWidth },"-=0.5");
						tl1.to(".lower-third.event .text",0.5,{ ease: Circ.easeOut, marginLeft: "0", opacity: 1 });
					} });
				}
				break;

			case "text_segment_title":
				if(newAnimation == false) {
					tl2.to(".lower-third.segment .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0, onComplete: function () {
						// Reset text position to the right
						tl2.to(".lower-third.segment .text",0,{ marginLeft: "2.5vw" });
						// Set Text
						$(".lower-third.segment .text").html(text);
						// Animate again
						tl2.to(".lower-third.segment .text",0.5,{ ease: Circ.easeOut, marginLeft: "0", opacity: 1 });
					} });
				} else {
					tl2.to(".lower-third.segment .text",1,{ ease: Circ.easeIn, marginLeft: "2.5vw" });
					tl2.to(".transition",0.3,{ ease: Circ.easeOut, width: "85vw", onComplete: () => {
						tl2.to(".lower-third.segment .text",0,{ marginLeft: "-2.5vw" });
						$(".lower-third.segment .text").html(text);
						tl2.to(".transition",0.3,{ ease: Circ.easeOut, width: 0, left: "85vw", onComplete: () => {
							tl2.to(".transition",0,{ width: 0, left: 0 });
						} });
						tl2.to(".lower-third.segment .text",0.5,{ ease: Circ.easeOut, marginLeft: "0" },"-=0.3");
					} },"-=0.1");
				}
				break;

			case "text_metadata":
				tl3.to(".lower-third.metadata .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0, onComplete: function () {
					$(".lower-third.metadata .text").marquee("destroy");
					// Reset text position to the right
					tl3.to(".lower-third.metadata .text",0,{ marginLeft: "2.5vw" });
					// Set Text
					$(".lower-third.metadata .text").html(text);
					// Calculate width of text to resize box.
					mwidth = (60+parseInt($(".lower-third.metadata .text").width()))+"px";

					// Animate again
					if(60+$(".lower-third.metadata .text").width() < 760) {
						tl3.to(".lower-third.metadata",0.5,{ ease: CubicBezier.config(0.4,0,0.2,1), width: mwidth });
					} else {
						tl3.to(".lower-third.metadata",0.5,{ ease: CubicBezier.config(0.4,0,0.2,1), width: "760px" });
					}
					tl3.to(".lower-third.metadata .text",0.5,{ ease: Circ.easeOut, marginLeft: "0", opacity: 1 });
					if($(".lower-third.metadata .text").width() > 720) {
						$(".lower-third.metadata .text").marquee(marqueeOptions);
					}
				} });
				break;
		}
	} else {
		// Graphics aren't visible here, so no need to animate. We can just update the text.
		switch(className) {
			case "text_event_title":
				$(".lower-third.event .text").html(text);
				break;

			case "text_segment_title":
				$(".lower-third.segment .text").html(text);
				break;

			case "text_metadata":
				$(".lower-third.metadata .text").html(text);
				break;
		}
	}
}

function updateGFX(data, immediate) {
	if(currentData !== data) {
		// Animate!
		for(var key in data) {
			switch(key) {
				case "mode":
					$("body").attr("class",data["mode"]);
					break;
				case "text_event_title":
					updateText("text_event_title",data.text_event_title);
					break;
				case "text_segment_title":
					updateText("text_segment_title",data.text_segment_title);
					break;
				case "text_metadata":
					if(data.metadata_np) {
						updateText("text_metadata",nowPlaying);
					} else {
						updateText("text_metadata",data.text_metadata);
					}
					break;
			}
		}
		// Make currentData equal to the incoming data, so we know not to animate the GFX every time the server broadcasts an update:
		currentData = data;
	}
}

function animateGFX(data) {
	if(data.hasOwnProperty("visible")) {
		if(data.visible == 1 & !visible) {
			if(mini) {
				tl.to(".lower-third.event",0,{ top: "0px" });
				tl.to(".lower-third.metadata",0,{ marginLeft: 0 });
				tl.to(".lower-third.segment",0,{ height: "120px", top: "70px", opacity: 1 });
				tl.to(".lower-third.segment .text",0,{ marginLeft: "2.5vw", opacity: 0 });
				tl.to(".lower-third.segment .text",0,{ marginLeft: "0vw", opacity: 1 });
				tl.to(".lower-third.clock",0,{ opacity: 1 });
				tl.staggerTo(".lower-third .text",0,{ marginLeft: "-2.5vw", opacity: 0 },0);
				tl.to(".lower-third.clock",0,{ opacity: 0 });
				tl.to(".lower-third.event",0,{ width: 0, left: "0vw" });
				tl.to(".lower-third.segment",0,{ width: 0, left: "0vw" });
				tl.to(".lower-third.metadata",0,{ width: 0, left: "0vw" });
				mini = false;
				miniInUse = false;
			}
			$(".lower-third .text").css("margin-left","5vw");
			eventWidth = (60+parseInt($(".lower-third.event .text").width()))+"px";
			if(firstRun == true) {
				mwidth = (60+parseInt($(".lower-third.metadata .text").width()))+"px";
				firstRun = false;
			}
			tl.to(".lower-third.event",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: eventWidth, left: "5vw" });
			tl.to(".lower-third.segment",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: "85vw", left: "5vw" },"-=0.90");
			if(60+$(".lower-third.metadata .text").width() < 760) {
				tl.to(".lower-third.metadata",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: mwidth, left: "5vw" },"-=0.90");
			} else {
				tl.to(".lower-third.metadata",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: "760px", left: "5vw" },"-=0.90");
			}
			tl.to(".lower-third.metadata",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: mwidth, left: "5vw" },"-=0.90");
			tl.staggerTo(".lower-third .text",1,{ ease: CubicBezier.config(0,0,0.2,1), marginLeft: 0, opacity: 1 },0.2,"-=0.90");
			tl.to(".lower-third.clock",1,{ ease: CubicBezier.config(0,0,0.2,1), opacity: 1 },"-=0.90");

			if($(".lower-third.metadata .text").width() > 720) {
				$(".lower-third.metadata .text").marquee(marqueeOptions);
			}

			//if(parseInt(mwidth.replace("px","")) > 720) {
			//	$(".lower-third.metadata .text").marquee(marqueeOptions);
			//}
			visible = true;
		} else if(data.visible == 0 & visible) {
			tl.staggerTo(".lower-third .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0 },0.1);
			tl.to(".lower-third.clock",0.5,{ ease: CubicBezier.config(0,0,0.2,1), opacity: 0 },"-=0.4");
			tl.to(".lower-third.event",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: 0, left: "0vw" });
			tl.to(".lower-third.segment",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: 0, left: "0vw" },"-=0.90");
			tl.to(".lower-third.metadata",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: 0, left: "0vw", onComplete: () => {
				$(".lower-third.metadata .text").marquee("destroy");
			} },"-=0.90");
			visible = false;
		}
	}
}

socket.on( 'update', ( data, immediate ) => {
		newData = data;
		updateGFX(data, immediate);
	} )
	.on( 'nowplaying', ( data, immediate ) => {
		nowPlaying = data;
		if(currentData.metadata_np) {
			updateText("text_metadata", nowPlaying);
			console.log(nowPlaying);
		}
	} );


function debugConsole(data) {
	console.log(JSON.stringify(data));
}

function play() {
	setInterval( () => {
		var date = new Date();
		var hours = date.getUTCHours();
		var minutes = date.getUTCMinutes();

		var formattedTime = ( hours < 10 ? '0'+hours : hours ) + ":" + ( minutes < 10 ? '0'+minutes : minutes );

		var meridian = 'UTC';
		$('.clocktext').html(formattedTime + " <span class='clockutc'>"+meridian+"</span>");
	}, 400 );
	setTimeout(function () {
		animateGFX({visible: 1});

	},1000);
}

function update(str) {
	if(!firstRun) {
		if(str == "<templateData></templateData>" || str == "") {
			console.error("Data NEEDS to be JSON formatted! :3");
		} else {
			data = JSON.parse(str);
			animateGFX(data);
		}
	}
}
function demoText() {
	updateText("text_segment_title","XBN – Broadcast Graphics Test");
}
function next() {
	if(visible & !miniInUse) {
		miniInUse = true;
		if(!mini) {
			tl.to(".lower-third.segment .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0 });
			tl.to(".lower-third.clock",0.5,{ ease: CubicBezier.config(0,0,0.2,1), opacity: 0 },"-=0.4");
			tl.to(".lower-third.segment",1,{ ease: CubicBezier.config(0.4,0,0.2,1), height: 0, top: "200px", opacity: 0 });
			console.log($(".lower-third.event").width());
			tl.to(".lower-third.event",1,{ ease: CubicBezier.config(0.4,0,0.2,1), top: "200px" },"-=0.7");
			tl.to(".lower-third.metadata",0.5,{ ease: CubicBezier.config(0.4,0,0.2,1), marginLeft: $(".lower-third.event").width()+18, onComplete: () => {
				mini = true;
				miniInUse = false;
			} },"-=1");
		} else {
			tl.to(".lower-third.event",1,{ ease: CubicBezier.config(0.4,0,0.2,1), top: "0px" });
			tl.to(".lower-third.metadata",1,{ ease: CubicBezier.config(0.4,0,0.2,1), marginLeft: 0 },"-=0.8");
			tl.to(".lower-third.segment",1,{ ease: CubicBezier.config(0.4,0,0.2,1), height: "120px", top: "70px", opacity: 1 },"-=0.8");
			tl.to(".lower-third.segment .text",0,{ marginLeft: "2.5vw", opacity: 0 });
			tl.to(".lower-third.segment .text",1,{ ease: CubicBezier.config(0,0,0.2,1), marginLeft: "0vw", opacity: 1 });
			tl.to(".lower-third.clock",1,{ ease: CubicBezier.config(0,0,0.2,1), opacity: 1, onComplete: () => {
				mini = false;
				miniInUse = false;
			} },"-=0.4");
		}
	}
}

function stop() {
	if(visible) {
		tl.staggerTo(".lower-third .text",0.5,{ ease: Circ.easeIn, marginLeft: "-2.5vw", opacity: 0 },0.1);
		tl.to(".lower-third.clock",0.5,{ ease: CubicBezier.config(0,0,0.2,1), opacity: 0 },"-=0.4");
		tl.to(".lower-third.event",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: 0, left: "0vw" });
		tl.to(".lower-third.segment",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: 0, left: "0vw" },"-=0.90");
		tl.to(".lower-third.metadata",1,{ ease: CubicBezier.config(0.4,0,0.2,1), width: 0, left: "0vw", onComplete: () => {
			$(".lower-third.metadata .text").marquee("destroy");
		} },"-=0.90");
		visible = false;
	}
}
