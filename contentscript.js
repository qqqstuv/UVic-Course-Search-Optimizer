
var courseInfos = []; // hold information of UVic courses in Uvic website
var allCoursesInfoLength = 0; // length of all course. Should be double of the actual number of courses
baseURL ="http://web.uvic.ca/calendar2016-09/CDs/";

function main() {
    var allCoursesInfo = $(".dddefault");
    allCoursesInfoLength = allCoursesInfo.length;
    var checkWebsite = $(":input[name='sel_subj']");
    if(allCoursesInfoLength % 2 == 0 && allCoursesInfoLength != 0 && checkWebsite.length){
    	for (var i = 0; i < allCoursesInfoLength; i += 2) {
    		var courseInfo = [allCoursesInfo[i], allCoursesInfo[i+1]];
    		courseInfos.push(courseInfo);
    	};
        // console.log(courseInfos);
        setUpDescription(allCoursesInfo);
    } else{
    	// console.log("Not the correct site");
    }
}

function setUpDescription(allCoursesInfo) {//Set up hovering  here
    $.each(allCoursesInfo, function(index, value){
        var courseInfosIndex = Math.floor(index/2); // reference in couseInfos
        var number = courseInfos[courseInfosIndex][0].innerHTML;
        //look up short version of course name
        var lookUpCode = $(":input[name='sel_subj']");
        var subj;

        $.each(lookUpCode, function(index, value){ // get the short version subject of the course
                if(value.value !== "dummy"){
                    subj = value.value;
                    return false;
                }
        });
        var id = subj + number;
        $(value).hover(function(e){ //On hover
            var existDiv = $("#" + id + ".description");
            if(existDiv.length){
                existDiv.show();
            } else{
                chrome.runtime.sendMessage({
                    number: number,
                    subj: subj,
                    message : "fetch_data"
                }, function(response){  // callback to process the fetched data
                    makeDescription(response, courseInfosIndex);
                })
            }
  
        }, function(){ //Off hover, hide the tag
            $("#" + id + ".description").hide();
        });

        $(value).click(function(){
            var openURL = baseURL.concat(subj,'/',number,'.html');
            window.open(openURL);
        });

    })
}

function makeDescription(response, index){ // index in courseInfos
    var number = response.number;
    var subj = response.subj;
    var data = response.data; // content of html page from web.uvic.ca
    if($(data).find(".description")[0]){
        var newDiv = $("<div>").attr("id", subj+number).addClass("description");

        // course Title
        newDiv.append($("<div>").attr("id", "course-title").text(subj + ' ' + number).css({ 'font-weight': 'bold'}));
        
        // description
        var description = $(data).find(".description")[0].innerHTML;
        newDiv.append($("<div>").attr("id", "full-description").text(description));

        // prerequisite & co-prerequisite
        addprerequisite(data, newDiv);
        addcoprerequisite(data, newDiv);


        $(courseInfos[index][0]).parent().append(newDiv);
        //Customize div
        var position = $(courseInfos[index][1]).position();
        var width = $(courseInfos[index][1]).width();
        // var extrawidth = $(courseInfos[index][1]).parent().children[2].width();
        newDiv.css({
            'position': 'absolute',
            'top': position.top,
            'left': position.left + width,
            'background-color': 'lightblue',
            'font-size': 15,
            'border-style': 'groove'
         }).width(400);
        if($(courseInfos[index][0]).parent().is(':hover')){
            newDiv.show();
        } else{
            newDiv.hide();
        }
        // console.log(newDiv);
    } else{
        // console.log("No description who cares");
    }
}
    
function addprerequisite(data, newDiv){
    var prereq = $(data).find(".prereq");
    if(prereq[0]){
        var prereqDiv = $("<div>").addClass("prereq");
        prereqDiv.append($("<div>").attr("id", "prerequisite-title").text("Prerequisite").css({ 'font-weight': 'bold'}));
        $.each(prereq[0].children, function(index, value){
            prereqDiv.append($("<div>").attr("id", "prereq" + index).text(value.outerText));
        })
        newDiv.append(prereqDiv);
    }
}

function addcoprerequisite(data, newDiv){
    var precoreq = $(data).find(".precoreq");
    if(precoreq[0]){
        var precoreqDiv = $("<div>").addClass("precoreq");
        precoreqDiv.append($("<div>").attr("id", "precorequisite-title").text("Pre-corequisite").css({ 'font-weight': 'bold'}));
        $.each(precoreq[0].children, function(index, value){
            precoreqDiv.append($("<div>").attr("id", "precoreq" + index).text(value.outerText));
        })
        newDiv.append(precoreqDiv);
    }
}
/****************LAZY*SEARCH**********************/

chrome.runtime.onMessage.addListener( // these functions are called after the page is loaded
  function(request, sender, sendResponse) {
    if( request.message === "requestSetTerm" ) {
        setTerm(request.key);
        return true;
    } else if(request.message === "requestSetSubject"){
        setSubject(request.key);
        return true;
    } else if(request.message === "requestSetCourseId"){
        setCourseId(request.key);
        return true;
    }
  }
);

function setTerm(term){ // set semester and click submit
    if($('.pldefault').length == 6){
        var testString = $('.pldefault')[3].innerText;
        if(testString.indexOf("Select Term or Date Range") !== -1){ // verify the page
            var form = $('form[action="/BAN1P/bwckgens.p_proc_term_date"]');
            if(form.length == 1){ // verify that there is only one form
                $('#term_input_id').val(term);
                $(form[0].children[4]).trigger("click");
                // Once everything is done, send a response to background to proceed requestSubject
                // chrome.runtime.sendMessage({
                //     message : "responseSetTerm"
                // });
            }
        }
    }    
}

function setSubject(subject){ // set subject and click submit
    $("#subj_id").val(subject);
    var buttons = $('input[name="SUB_BTN"]');
    if(buttons.length == 2){ // just extra checking for error
        if(buttons[0].value === "Course Search"){
            $(buttons[0]).trigger("click");
        }
    }
}

function setCourseId(id){
    $.each(courseInfos, function(index, value){
        if(value[0].innerText === id){
            var button = $(value[0].parentElement).find($("input[name='SUB_BTN']"));
            button.trigger("click");
        }
    });
}


main();
