'use strict'

var messageList = [];
var interval = null;
var mainUrl = 'http://localhost:999/chat';
var token = 'TN11EN';

var run = function () {
	var currentUserName = document.getElementById('currentUserName');
		currentUserName.textContent = restoreName() || (('Vadim') + uniqueId().substring(0, 5));
	var sendButton = document.getElementById('sendButton');
		sendButton.onclick = send;
	var buttonEditProfile = document.getElementById('buttonEditProfile');
		buttonEditProfile.onclick = showEditProfile;
}();

var interval = setInterval("getServerResponse()", 500);

function storeName (nameToSave) {
	var stringToSave = JSON.stringify(nameToSave);
	localStorage.setItem("Previos name", stringToSave); 
}

function restoreName () {
	if(typeof(Storage).toString === "undefined") {
		return;
	}
	var item = localStorage.getItem("Previos name");
	return item && JSON.parse(item); 
}

function innerRestoredMesseges (_newMessageListFromServer) {
	var chatField = document.getElementById('chatField');
	var size = _newMessageListFromServer.length;
	for (var i = 0; i < size; ++i) {
		var newLi = document.createElement('li');
		newLi.setAttribute('class', 'media');
		if (_newMessageListFromServer[i].deleted === true) {
			newLi.innerHTML = '<div class="row"><div class="col-md-12 text-center"><small class="text-muted center">Message was deleted</small></div></div>';
		} else if (_newMessageListFromServer[i].editDelete === true){
					newLi.innerHTML = '<div class="media-body"><div class="media"><a class="pull-left" href="#"><img class="media-object img-circle" src="message.png"></a><div class="media-body edit"><span class="currentChatText">'+
					_newMessageListFromServer[i].message
					+'</span><br><small class="text-muted"><span class="userNameEditDelete">'+
					_newMessageListFromServer[i].author
					+'</span> | '+
					_newMessageListFromServer[i].date
					+ '</small><small class="text-muted pull-right editDelete"><a href="#">Edit</a> | <a href="#">Delete</a></small><hr></div></div></div>';
		} else if (_newMessageListFromServer[i].editDelete === false){
				newLi.innerHTML = '<div class="media-body"><div class="media"><a class="pull-left" href="#"><img class="media-object img-circle" src="message.png"></a><div class="media-body edit"><span class="currentChatText">'+
				_newMessageListFromServer[i].message
				+'</span><br><small class="text-muted"><span class="userNameEditDelete">'+
				_newMessageListFromServer[i].author
				+'</span> | '+
				_newMessageListFromServer[i].date
				+ '</small><small class="text-muted pull-right editDelete"></small><hr></div></div></div>';
		}
		chatField.appendChild(newLi);
	}
	var srcroll = document.getElementById('scrollDown');
	srcroll.scrollTop = srcroll.scrollHeight; 
}

function getAllHistoryFromServer (_firstResponseFromServer) {
	var messageListFromServer = [];
	token = _firstResponseFromServer.token;
	messageListFromServer = _firstResponseFromServer.message;
	for (var i = 0; i < messageListFromServer.length; ++i) {
		if (messageListFromServer[i].methodRequest === 'POST') {
			messageList.push(messageListFromServer[i]);
		}
	}
}

function changeItemMessageListPUT (PUTmessage) {
	for (var i = 0; i < messageList.length; ++i) {
		if (messageList[i].id === PUTmessage.id) {
			var k = 0;
			var editLi = document.getElementById('chatField').firstChild.nextSibling;
			while (k !== i) {
				editLi = editLi.nextSibling;
				++k;
			}

			editLi = editLi.getElementsByClassName('media-body edit')[0];
			PUTmessage.message = PUTmessage.message.replace(/\r?\n/g, '<br>');
   			editLi.innerHTML = '<span class="currentChatText">'+
			PUTmessage.message
			+'</span><br><small class="text-muted"><span class="userNameEditDelete">'+
			messageList[i].author
			+'</span> | '+
			PUTmessage.date
			+'</small><small class="text-muted pull-right editDelete"><a href="#">Edit</a> | <a href="#">Delete</a></small><hr>';
			messageList[i].message = PUTmessage.message;
			messageList[i].date = PUTmessage.date;
		}
	}
}

function changeItemMessageListDELETE (DELETEmessage) {
	for (var i = 0; i < messageList.length; ++i) {
		if (messageList[i].id === DELETEmessage.id) {
			var k = 0;
			var del = document.getElementById('chatField').firstChild.nextSibling;
			while (k !== i) {
				del = del.nextSibling;
				++k;
			}
			del.innerHTML = '<div class="row"><div class="col-md-12 text-center"><small class="text-muted center">Message was deleted</small></div></div>';
			messageList[i].deleted = true;
		}
	}
}

function editDeleteResponseToBoolean (serverResponse) {
	for (var i = 0; i < serverResponse.length; ++i) {
		if (serverResponse[i].deleted === 'false') {
			serverResponse[i].deleted = false;
		} else {
			serverResponse[i].deleted = true;
		}

		if (serverResponse[i].editDelete === 'false') {
			serverResponse[i].editDelete = false;
		} else {
			serverResponse[i].editDelete = true;
		}
	}
	return serverResponse;
}

function getServerResponse (continueWith) {
	var url = mainUrl + '?token=' + token;
	get(url, function(responseText) {

		console.assert(responseText != null);
		var response = JSON.parse(responseText);
		if (token < response.token) {
			response.message = editDeleteResponseToBoolean(response.message);
			if (token === 'TN11EN')	{
				getAllHistoryFromServer(response);
				innerRestoredMesseges(messageList);
			} else {
				var messageListFromServer = response.message;
				var messageListToInner = [];
				for (var i = 0; i < messageListFromServer.length; ++i) {
					if (messageListFromServer[i].methodRequest === 'DELETE') {
						changeItemMessageListDELETE (messageListFromServer[i]);
					} else if (messageListFromServer[i].methodRequest === 'PUT') {
						changeItemMessageListPUT (messageListFromServer[i]);
					} else if (messageListFromServer[i].methodRequest === 'POST') {
						messageListToInner.push(messageListFromServer[i]);
						messageList.push(messageListFromServer[i]);
					}
				}
				innerRestoredMesseges(messageListToInner);
			}

			token = response.token;
			editDeleteWithCurrentUserName ();	
		}
		continueWith && continueWith();
	});
}

function get(url, continueWith, continueWithError) {
	ajax('GET', url, null, continueWith, continueWithError);
}

function post(url, data, continueWith, continueWithError) {
	ajax('POST', url, data, continueWith, continueWithError);	
}

function put(url, data, continueWith, continueWithError) {
	ajax('PUT', url, data, continueWith, continueWithError);	
}

function delete_(url, data, continueWith, continueWithError) {
	ajax('DELETE', url, data, continueWith, continueWithError);	
}

function isError(text) {
	if(text == "")
		return false;
	
	try {
		var obj = JSON.parse(text);
	} catch(ex) {
		return true;
	}

	return !!obj.error;
}

function defaultErrorHandler(message) {
	clearInterval(interval);
	console.error(message);
	output(message);
	setTimeout(function () {
    	interval = setInterval("getServerResponse()", 500);
    }, 3000);
}

function ajax(method, url, data, continueWith, continueWithError) {
	var xhr = new XMLHttpRequest();
	continueWithError = continueWithError || defaultErrorHandler;
	xhr.open(method || 'GET', url, true);

	xhr.onload = function () {
		if (xhr.readyState !== 4)
			return;

		if(xhr.status != 200) {
			continueWithError('Error on the server side, response ' + xhr.status);
			return;
		}

		var responseText = xhr.responseText.replace(/\r?\n/g, '\\n');
		var connection = document.getElementById('connection');
		if (connection.value !== 'Connection is great!') {
			connection.innerHTML = 'Connection is great!';
		}

		if(isError(responseText)) {
			continueWithError('Error on the server side, response ' + xhr.responseText);
			return;
		}

		continueWith(responseText);
	};    

    xhr.ontimeout = function () {
    	continueWithError('Server timed out !');
    }

    xhr.onerror = function (e) {
    	var errMsg = 'Server connection error !\n'+
    	'Check if server is active';
        continueWithError(errMsg);
    };

    xhr.send(data);
}

window.onerror = function(err) {
	output(err.toString());
}

function output (str) {
	var connection = document.getElementById('connection');
	connection.innerHTML = str;
}

function storeSend(_deleted, _message, _author, _date, _editDelete, _id, _methodRequest) {
	return {
		deleted: _deleted,
		message: _message,
 		author:  _author,
 		date: _date,
 		editDelete:  _editDelete,
 		id: _id,
 		methodRequest: _methodRequest
	};
}

function send (event) {
	//will not send form (reload page), if click submit button
	if (event.preventDefault) {
    	event.preventDefault();
   	}
	var currentUserName = document.getElementById('currentUserName'); 	
	var newMessageTextArea = document.getElementById('newMessageTextArea');
	var delEmptyText = newMessageTextArea.value.replace(/\r?\n?\t?\s/g, '');
	if ((newMessageTextArea.value !== '') && (delEmptyText !== ''))  {
		newMessageTextArea.value = newMessageTextArea.value.replace(/\r?\n/g, '<br>');
		//newMessageTextArea.value = newMessageTextArea.value.replace(/<\/?[^>]+(>|$)/g, '');
		var currentTime = getTime();     							
		var toStore = storeSend(false, newMessageTextArea.value, 
		currentUserName.textContent, currentTime, false, uniqueId(), 'POST');
		post(mainUrl, JSON.stringify(toStore), function(){
			getServerResponse();
		});

		var srcroll = document.getElementById('scrollDown');
		srcroll.scrollTop = srcroll.scrollHeight;
		newMessageTextArea.value = '';
	}
}

function showEditProfile (event) {
	var sendButton = document.getElementById('sendButton');
		sendButton.onclick = '';
	var currentUserName = document.getElementById('currentUserName');
		currentUserName.innerHTML = '';
		console.log(currentUserName.value);
	editDeleteWithCurrentUserName (); 
	var showFormEditProfile = document.getElementById('showFormEditProfile');
	showFormEditProfile.innerHTML ='<form class="form-inline" id="formEditProfile"><div class="form-group"><input type="text" class="form-control" style="height: 30px; width: 150px; display: inline" placeholder="Your name" id="inputEditProfile"><button type="submit" class="btn btn-info" style="height: 30px; display: inline" id="buttonSubmitProfile">edit</button></div></form>'
	var buttonSubmitProfile = document.getElementById('buttonSubmitProfile');
	buttonSubmitProfile.onclick = submitEditedProfile;
}

function submitEditedProfile (event) {
	//will not send form (reload page), if click submit button
	if (event.preventDefault) {
    	event.preventDefault();
   	}
   	var currentUserName = document.getElementById('currentUserName');
   	var inputEditProfile = document.getElementById('inputEditProfile');
   	if (inputEditProfile.value !== '') {
   		var formEditProfile = document.getElementById('formEditProfile');
		currentUserName.innerHTML = inputEditProfile.value;
		storeName(inputEditProfile.value);
		formEditProfile.style.display = 'none';
		sendButton.onclick = send;
		editDeleteWithCurrentUserName (); 
   	}
}

function storeSubmitEditedProfile (indexMessageItem, _editDelete) {
	var toStore = messageList[indexMessageItem];
	toStore.editDelete = _editDelete;
	return toStore; 
}

function editDeleteWithCurrentUserName () {
	var currentUserName = document.getElementById('currentUserName');
	var inputEditProfile = document.getElementById('inputEditProfile');
	var editDeleteArray = document.getElementsByClassName('text-muted pull-right editDelete');
	var usersArray = document.getElementsByClassName('userNameEditDelete');
	for (var i = 0; i < usersArray.length; ++i) {
		if (currentUserName.textContent !== usersArray[i].textContent) {
			editDeleteArray[i].innerHTML = '';

			var messageNumber = 0;
			var editLi = editDeleteArray[i];
			while (editLi.tagName != 'LI') {
				editLi = editLi.parentNode;
			}

			while (editLi.previousSibling.tagName === 'LI') {
				editLi = editLi.previousSibling;
				++messageNumber;
			}
			messageList[messageNumber] = storeSubmitEditedProfile(messageNumber, false);
		} else if (currentUserName.textContent === usersArray[i].textContent){
			editDeleteArray[i].innerHTML = '<a href="#">Edit</a> | <a href="#">Delete</a>';
			
			var messageNumber = 0;
			var editLi = editDeleteArray[i];
			while (editLi.tagName != 'LI') {
				editLi = editLi.parentNode;
			}

			while (editLi.previousSibling.tagName === 'LI') {
				editLi = editLi.previousSibling;
				++messageNumber;
			}
			messageList[messageNumber] = storeSubmitEditedProfile(messageNumber, true);
		}
	}
	addOnClickOnEditDelete ();
}

function addOnClickOnEditDelete () {
	var editDeleteArray = document.getElementsByClassName('text-muted pull-right editDelete');
	for (var i = 0; i < editDeleteArray.length; ++i) {
		if (editDeleteArray[i].lastChild !== null) {
			editDeleteArray[i].lastChild.onclick = deleteMessage;
		}
		if(editDeleteArray[i].firstChild !== null) {
			editDeleteArray[i].firstChild.onclick = editMessage;
		}
	}
}

function storeDeleteMessage (indexMessageItem, _deleted, _methodRequest) {
	var toStore = messageList[indexMessageItem];
	toStore.deleted = _deleted;
	toStore.methodRequest = _methodRequest;
	return toStore; 
}

function deleteMessage (event) {
	var deleteLi = event.target;
	while (deleteLi.tagName != 'LI') {
		deleteLi = deleteLi.parentNode;
	}

	var messageNumber = 0;
	while (deleteLi.previousSibling.tagName === 'LI') {
		deleteLi = deleteLi.previousSibling;
		++messageNumber;
	}	

	var toStore = storeDeleteMessage(messageNumber, true, 'DELETE');
	delete_(mainUrl, JSON.stringify(toStore), function(){
		getServerResponse();
	});
}

function storeEditMessage (indexMessageItem, _date, _message, _methodRequest) {
	var toStore = messageList[indexMessageItem];
	toStore.date = _date;
	toStore.message = _message;
	toStore.methodRequest = _methodRequest;
	return toStore; 
}

function editMessage (event) {
	var sendButton = document.getElementById('sendButton');
	sendButton.onclick = '';
	var editLi = event.target;
	while (editLi.className != 'media-body edit') {
		editLi = editLi.parentNode;
	}

	for (var i = 0; i < editLi.firstChild.childNodes.length; ++i) {
		if (editLi.firstChild.childNodes[i].tagName === 'BR') {
			editLi.firstChild.childNodes[i].innerHTML = '\n';
		}
	}
	var currentTextAreaContent = editLi.firstChild.textContent;  
	editLi.innerHTML = '<div class="input-group"><textarea type="text" class="form-control" id="editMessageTextArea" style="height:60px; resize: none">'+
	currentTextAreaContent 
	+'</textarea><span class="input-group-btn"><button type="submit" class="btn btn-info pull-right" id="editButtonTextArea" style="height:60px">edit</button></span></div>';
	var editMessageTextArea = document.getElementById('editMessageTextArea');
	var editButtonTextArea = document.getElementById('editButtonTextArea');

	editButtonTextArea.onclick = function (event) {
		//will not send form (reload page), if click submit button
		if (event.preventDefault) {
    		event.preventDefault();
   		}

   		if (editMessageTextArea.value !== '') {
   			//editMessageTextArea.value = editMessageTextArea.value.replace(/<\/?[^>]+(>|$)/g, '');
			var messageNumber = 0;
			while (editLi.tagName != 'LI') {
				editLi = editLi.parentNode;
			}

			while (editLi.previousSibling.tagName === 'LI') {
				editLi = editLi.previousSibling;
				++messageNumber;
			}

			var currentTime = 'Message was edited on ' + getTime();
			var toStore = storeEditMessage(messageNumber, currentTime, editMessageTextArea.value, 'PUT');

			put(mainUrl, JSON.stringify(toStore), function() {
				getServerResponse();
			});
		}
		sendButton.onclick = send;
	}
}

function getTime () {
	var currentTime = new Date();
	var hh = currentTime.getHours();
	var mm = currentTime.getMinutes();
	var ss = currentTime.getSeconds();

	if (hh < 10) { hh = '0' + hh; }

	if (mm < 10) { mm = '0' + mm; }

	if (ss < 10) { ss = '0' + ss; }

	return (currentTime.toDateString() + ' ' + hh + ':' + mm + ':' + ss);
}

function uniqueId () {
	var date = Date.now();
	var random = Math.random() * Math.random();

	return Math.floor(date * random).toString();
}