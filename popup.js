var semesterUrl = "https://www.uvic.ca/BAN1P/bwckschd.p_disp_dyn_sched";
var subjectUrl = "https://www.uvic.ca/BAN1P/bwckgens.p_proc_term_date"; 
var courseIdUrl = "https://www.uvic.ca/BAN1P/bwckschd.p_get_crse_unsec"; // the most annoying url to work with
var formData = "";

subjectList = [];
semesterList = [];
courseIdList = [];

storageItems = [];

$(document).ready(function(){
	// chrome.storage.sync.clear();
	/* Setting up stuff */
	chrome.storage.sync.get(null, function(items) {
    	$.each(items, function(index, storageItem){
    		if(storageItem.hasOwnProperty("history")){
    			storageItems.push(storageItem);
    		}
    	})
    	loadHistory();
    });
	chrome.runtime.sendMessage(
		{message: "deleteCookie"},
		function(response) {
			getSemester();
		}
	);
	/* Binding stuff*/
	$(".semester").change(function(){
		getSubjectArea(this.value);
	});
	$(".subject-area").change(function(){
		getCourseIds(formData, this.value);
	});
	$("#navigate").click(function(){ // Lazy Search
		saveSearch($(".semester").val(), $(".subject-area").val(), $(".course-id").val());
    	doNavigate($(".semester").val(), $(".subject-area").val(), $(".course-id").val());
	});
	$("#save").click(function(){
		saveSearch($(".semester").val(), $(".subject-area").val(), $(".course-id").val());
	});
	$("#import").click(function(){ // Lazy Search
		importCourses();
	});
});

function doNavigate(semester, subject, id){
	console.log(semester, subject, id);
	chrome.runtime.sendMessage(
		{
			message: "navigate",
			semester: semester,
			subjectArea: subject,
			courseId: id
		},
		function(response) {
			console.log(response);
		}
	);	
}

function saveSearch(semester, subject, id){ // Save to local storage and display the new item
	var searchParam = {
		'history' : true,
		'semester': semester,
		'subjectArea': subject,
		'courseId' : id
	};
	var obj = {};
	//use value to construct key. Should change this.
	var key = semester + subject + id + "";
	obj[key] = searchParam;
	//Save search History
	chrome.storage.sync.get(key, function(item){
		var exist = false;
		$.each(item, function(index,value){ // check if the list already has the course
			exist = true;
			return false;
		});
		if(!exist){
			chrome.storage.sync.set(obj,function(){
				console.log('History Saved');
		    });
		    //Display the newly saved search
		    displaySavedSearch(semester, subject, id);
			bindAction(semester, subject, id);
		}
	});
}

function getSemester(){
	try{
		$.get(semesterUrl, function(data){
			$(data).find("#term_input_id option").each(function(index, value){
				var item = $(value);
				if(!(item.text().indexOf('View only') > -1) && !(item.text().indexOf('None') > -1)){
					semesterList.push({value : item.val(),text : item.text()});
				}
			})
			//start appending semester
			if(semesterList.length != 0){
				// console.log($('.semester'));
				$.each(semesterList, function(index, info) {
				    $('.semester').append(new Option(info.text, info.value));
				});
				getSubjectArea(semesterList[0].value); // call this the first time
				semesterList = [];
			}
		});
	}catch(err){
	        console.log(err);
	}
	return true;	
}

function getSubjectArea(semester){
	try{
		$("#icon-subject").show();
		$.post(subjectUrl,
		{
			p_calling_proc: 'bwckschd.p_disp_dyn_sched',
			p_term: semester
		}, function(data){
			// console.log($($(data).find('form')[0][11]).val('CSC'));
			// console.log($(data).find('form'));
			$(data).find("#subj_id option").each(function(index, value){
				var item = $(value);
				subjectList.push({value : item.val(),text : item.text()});
			})
			if(subjectList.length != 0){
				// delete then append new list
				$('.subject-area').empty();
				$.each(subjectList, function(index, info) {
				    $('.subject-area').append(new Option(info.text, info.value));
				});
				var subjectChosen = subjectList[0].value;
				subjectList = [];
				formData = $(data).find('form').serialize();
				getCourseIds(formData, subjectChosen); // call this the first time
			}
			$("#icon-subject").hide();
		});
		// console.log("try to fetch subject area info for semester" + semester);
	}catch(err){
	        console.log(err);
	}

	return true;	
}



function getCourseIds(data, subjectChosen){ // get all courses info based on subjectChosen
	if(data){
		data = data.concat("&sel_subj=").concat(subjectChosen);
		$("#icon-course").show();
		try{
			$.post(courseIdUrl,data,
				function(response){
					var omit = "";
					var allcourses = $(response).find('.ddtitle').each(function(index, value){
						var item = $(value);
						var fullcourseName = item[0].innerText;
						var courseNumber = fullcourseName.substring(fullcourseName.lastIndexOf(subjectChosen) + subjectChosen.length + 1, fullcourseName.lastIndexOf("-") - 1);
						var courseName = fullcourseName.substring(0,fullcourseName.indexOf("-"));
						if(courseNumber !== omit){ //check for reoccurence
							omit = courseNumber;
							courseIdList.push({value : courseNumber,text : courseNumber + " "+ courseName  });
						}
					});
					if(courseIdList.length != 0){
						$('.course-id').empty();
						$('.course-id').append(new Option("None", "None"));
						$.each(courseIdList, function(index, info) {
						    $('.course-id').append(new Option(info.text, info.value));
						});
						courseIdList = [];
					}
					$("#icon-course").hide();
			});
		}catch(err){
			console.log(err);
		}
		// console.log("try to fetch ids info");
		return true;		
	}else{
		console.lastIndexOfg("formData is null");
		return false;
	}
}

function loadHistory(){	
	$.each(storageItems, function(index, value){
		displaySavedSearch(value.semester, value.subjectArea, value.courseId);
		bindAction(value.semester, value.subjectArea, value.courseId);
	});
	
}

function bindAction(semester, subjectArea, courseId){

	$(".RemoveButton").click(function(e){
		e.stopPropagation();
		var liDiv = $(this).closest('li');
		chrome.storage.sync.remove(liDiv.attr('id'));
		liDiv.remove();
	});
	var idWrap = semester + subjectArea + courseId + "";
	$('#' + idWrap).click(function(){
		chrome.storage.sync.get(idWrap, function(item){
			item = item[idWrap]; // get the only element in the history
			doNavigate(item.semester, item.subjectArea, item.courseId);
		});
	});
}

function displaySavedSearch(semester, subjectArea, courseId){
	// console.log(semester, subjectArea, courseId);
	var message = semester + "-"+  subjectArea + "-" + courseId;
	var id = semester + subjectArea + courseId + "";
	var img = $('<img>').attr('src', 'remove.png').width(24).height(24).addClass('RemoveButton');
	var newLi = $('<li>').addClass('SearchEntry').attr("id", id).append($('<span>').text(message).append(img));
	$("#exist").append(newLi);
}

function importCourses(){ // find the right courses based on semester
	var year = $(".semester").val().substring(0,4);
	var month = $(".semester").val().substring(5,7);
	console.log(month, year);
	var idSearch = "course_list_";
	if(month === "1")
		idSearch = idSearch.concat("spring");
	else if(month === "5")
		idSearch = idSearch.concat("summer");
	else if( month === "9")
		idSearch = idSearch.concat("fall");
	$.post(
		"http://schedulecourses.com/account/courses",
		function(response){
			var data = $(response).find('#course_list_spring .course_list table tbody tr');
			//TODO: maybe check if the year match?
			if(data.length !== 0){
				$.each(data, function(index, value){
					var subject = value.children[1].innerText;
					var id = value.children[2].innerText;
					saveSearch($(".semester").val(), subject, id);
				})
			}

	});
}