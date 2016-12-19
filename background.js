descriptionUrl ="http://web.uvic.ca/calendar2016-09/CDs/";
setSearchBaseUrl ="https://www.uvic.ca/mypage/render.userLayoutRootNode.uP?uP_fname=student-services#bwskfcls.p_sel_crse_search";
setSubjectUrl ="https://www.uvic.ca/mypage/render.userLayoutRootNode.uP?uP_fname=student-services#bwckgens.p_proc_term_date";
setCourseIdUrl = "https://www.uvic.ca/mypage/render.userLayoutRootNode.uP?uP_fname=student-services#bwskfcls.P_GetCrse";

var lazySearchInfo =[];
var tabIndex = -1;
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	if(request.message === "navigate"){
  		chrome.tabs.create({"url": setSearchBaseUrl}, function(tab){
  			tabIndex = tab.id;
  		}); // open a new window and let onUpated handle the rest
  		lazySearchInfo.push(request.semester,request.subjectArea,request.courseId); // store request
		// console.log(lazySearchInfo);
  	}
  	else if( request.message === "fetch_data" ) {
    	realURL = descriptionUrl.concat(request.subj,'/',request.number,'.html');
    	// console.log(realURL); // this is the url that we use to fetch description
		try{
		     $.get(realURL, function(data){
	                var respObj  = {data: data, subj: request.subj, number: request.number};
	                sendResponse(respObj);
		        });
		    }catch(err){
		        console.log(err);
		}
		return true; //prevents callback being sent too early
    } else if( request.message === "deleteCookie"){
    	deleteCookie();
    	// console.log("done deleting cookie");
    }	
  }
);

// This works based solely on the fact that the user won't change tab during lazy search
chrome.tabs.onUpdated.addListener(function (tabId, info) {
	if(info.status === "complete"){
		if(tabId === tabIndex){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				// console.log(tabs[0]); // this is the new lazy uvic tab
				if(tabs[0].url === setSearchBaseUrl){
					chrome.tabs.sendMessage(tabs[0].id, {message: "requestSetTerm", key: lazySearchInfo[0]});
				} else if(tabs[0].url === setSubjectUrl){
					chrome.tabs.sendMessage(tabs[0].id, {message: "requestSetSubject", key: lazySearchInfo[1]});
				} else if(tabs[0].url === setCourseIdUrl){
					if(lazySearchInfo[2].length){ // check if id exist
						chrome.tabs.sendMessage(tabs[0].id, {message: "requestSetCourseId", key: lazySearchInfo[2]});
						tabIndex = -1;
						lazySearchInfo =[]
					}
				}
			});	
		}
	}
});

function deleteCookie(domain, name) {
	var details = {url: null, name : null,domain :"uvic.ca"};
    chrome.cookies.getAll(details, function(cookie) {
       	for(k = 0; k < cookie.length; k++){
			if(cookie[k].name === "SESSID" || cookie[k].name === "SESSID_UV_128004"){
				var remove = {url: extrapolateUrlFromCookie(cookie[k]), name : cookie[k].name};
				chrome.cookies.remove(remove,function(details){
					// console.log(details);
				});
			}
        }
        return true;
    });
}

//got this from stackoverflow. pretty handy stuff
function extrapolateUrlFromCookie(cookie) { 
    var prefix = cookie.secure ? "https://" : "http://";
    if (cookie.domain.charAt(0) == ".")
        prefix += "www";
    return prefix + cookie.domain + cookie.path;
}

// for debugging
function logCookies(){
	var details = {url: null, name : null,domain :"uvic.ca"};
	chrome.cookies.getAll(details, function(cookie) {
       	for(k = 0; k < cookie.length; k++){
        	console.log( "after delete",
            	"name: " + cookie[k].name,
            	"domain: " + cookie[k].domain,
            	"value: " + cookie[k].value,
            	"path: " + cookie[k].path
        	);
        }
        console.log(cookie.length);
    });
}