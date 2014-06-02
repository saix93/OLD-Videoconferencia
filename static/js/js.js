//
//Copyright (c) 2014, Priologic Software Inc.
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright notice,
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//POSSIBILITY OF SUCH DAMAGE.
//

/*
Este archivo js se ha producido en base a un ejemplo de http://www.easyrtc.com/
El nombre de todas las funciones, variables, etc. está en inglés
Aún así, todas las funciones están comentadas en castellano y en inglés para facilitar su comprensión

This js file was produced based in an example from http://www.easyrtc.com/
The name of all functions, variables, etc. are in english
Anyway, every function is commented in spanish and english to make it understanding easier

Autor/Author: Raúl Torres González
*/

var selfEasyrtcid = "";

//Esta función se ejecuta cuando carga la página, para definir los estilos
//----This function is executed when the web starts, it is used to define the styles
function styles() {
    $("#cameraNotification").addClass("undisplayed");
    $("#chooseRoom").addClass("undisplayed");
    $("#videochat").addClass("undisplayed");
    $("#chat").addClass("undisplayed");
}

//Función que se utiliza para conectarse al servidor. Se dispara con el botón 'Conectarse'
//----This function is used to connect to the server. It is triggered with the 'Conectarse' button
function connect() {
    var username = document.getElementById('username').value;
    username = username.replace(/\s/g, "");

    if(username.length === 0){
        alert("Debes introducir un nombre de usuario");
        return;
    }


    easyrtc.setUsername(username);

    easyrtc.setApplicationName('VideoconferenciaRaulTorres');
    easyrtc.setPeerListener(addToConversation);
    easyrtc.setRoomOccupantListener(convertListToButtons);

    easyrtc.easyApp("VideoconferenciaRaulTorres", "myVideo", ["othersVideo"], loginSuccess, loginFailure);

    $("#cameraNotification").removeClass("undisplayed");
    $("#connectingText").append(document.createTextNode("Conectando como " + username + "..."));
    $("#connectButton").attr("disabled", "disabled");
}

//Función utilizada para unirse a una sala. El argumento 'global' se utiliza dependiendo del botón que se pulse
//----Function used to join a room. The 'global' argument is used depending on the button the user clicks on
function joinARoom(global){

    var newRoom = document.getElementById('roomName').value;
    newRoom = newRoom.replace(/\s/g, "");

    newRoom = newRoom.toLowerCase();

    //En caso de que se haya introducido el argumento 'global' se asigna el mismo a la variable 'newRoom'
    //----If the 'global' argument is given, it is assigned to the 'newRoom' variable
    if(global)
        newRoom = global;

    for(i in easyrtc.getRoomsJoined()){
        var actualRoom = i;
    };

    //Compruebo que no se ha introducido un nombre vacío o con espacios
    //----It will show an alert if an empty name or spaces is given
    if(newRoom.length === 0){
        alert("Debes introducir un nombre de sala");
        return;
    }

    //Compruebo que no está intentando unirse a una sala en la que ya está
    //----It will show an alert if the user is trying to join the room he is in
    if(newRoom === actualRoom){
        alert("Ya estás en esa sala");
        console.log("No puedes unirte a esta sala, puesto que ya estás en ella");
        return;
    }

    //Se saca al usuario de todas las salas en las que se encuentre, lo lógico es que sólo sea una
    //----It leaves all the rooms the user is in, usually, only one
    easyrtc.leaveRoom(actualRoom, function(actualRoom){
        console.log("Has salido de la sala " + actualRoom);
    }, function(errorCode, errorText, actualRoom){
        console.log("Fallo al salir de la sala " + actualRoom);
    });

    //Se une a la sala que se ha proporcionado
    //----It joins the room that the user gave
    easyrtc.joinRoom(newRoom, null, function(newRoom){
        console.log("Éxito al unirse a la sala " + newRoom);
    }, function(errorCode, errorText, newRoom){
        console.log("Fallo al unirse a la sala " + newRoom);
    });

    //Se crea el botón para escribir por la sala
    //----It creates the button to write a message for a room
    roomButton(newRoom);

    //Se vacía el campo del nombre de la sala
    //----It empties the 'roomName' input
    document.getElementById('roomName').value = "";

    $("#chat").removeClass("undisplayed");

    if(newRoom === 'global') {
        $("#videochat").addClass("undisplayed");
        $("#chat").removeClass("privateChat");
        $("#chat").addClass("globalChat");
    } else {
        $("#videochat").removeClass("undisplayed");
        $("#chat").removeClass("globalChat");
        $("#chat").addClass("privateChat");
    }
}

//Función que crea un botón por cada usuario conectado a una sala
//----This function makes a button for each user connected to a room
function convertListToButtons (roomName, occupants, isPrimary) {
    //Elimina todos los hijos del div donde se va a colocar la lista de usuarios
    //----It removes all the children of the 'otherClients' div
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }

    var callingDiv = document.getElementById('callingDiv');
    while (callingDiv.hasChildNodes()) {
        callingDiv.removeChild(callingDiv.lastChild);
    }

    //Crea el botón por cada usuario
    //----Creates the button for each user
    for(var easyrtcid in occupants) {

        //Si el usuario se encuentra en la sala global, crea un botón para susurrar a cada usuario
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                sendWhisper(easyrtcid);
            };
        }(easyrtcid);
        var label = document.createTextNode("Enviar a " + easyrtc.idToName(easyrtcid));
        if (roomName !== 'global')
            button.classList.add('undisplayed');

        button.appendChild(label);

        otherClientDiv.appendChild(button);

        //Si el usuario está en una sala privada, y hay otro usuario conectado a esa misma sala, aparecerá un botón para llamar
        //----If the user is in a private room, and there is another user in the same room, a call button will appear
        if(roomName !== 'global' && roomName !== 'default'){
            var button = document.createElement('button');
            button.onclick = function(easyrtcid) {
                return function() {
                    performCall(easyrtcid);
                };
            }(easyrtcid);
            var label = document.createTextNode("Llamar a " + easyrtc.idToName(easyrtcid));
            button.appendChild(label);

            callingDiv.appendChild(button);
        }
    }

    //En caso de que no haya ningún otro usuario conectado en tu misma sala, se muestra un mensaje
    //----If there is no user connected to the same room that the user is in, it shows a message
    if( !otherClientDiv.hasChildNodes() ) {
        otherClientDiv.innerHTML = "<em>No hay nadie más conectado en esta sala</em>";
    }
}

//Función que crea el botón de enviar de la sala
//----Function that makes the 'send' button of the room
function roomButton(roomName){
    var send = document.getElementById('send');

    send.onclick = function(roomName){
        return function(){
            sendRoomMessage(roomName);
        };
    }(roomName);
}

//Función que permite que al pulsar enter en el input text del nombre de usuario, se pulse el botón de conectarse
//----This function allows the user to connect to the server when pressing 'enter' in the username input text
function connectEnter(e){ 
  tecla=(document.all) ? e.keyCode : e.which; 
  if(tecla == 13) 
    connect(); 
}

//Función que permite que al pulsar enter en el input text del nombre de la sala, se pulse el botón de conectarse
//----This function allows the user to connect to the room when pressing 'enter' in the roomname input text
function roomEnter(e){ 
  tecla=(document.all) ? e.keyCode : e.which; 
  if(tecla == 13) 
    joinARoom(); 
}

//Función que permite que al pulsar enter en el input text del texto del chat, se pulse el botón de enviar
//----This function allows the user to send text when pressing 'enter' in the chat text input text
function sendEnter(e){ 
  tecla=(document.all) ? e.keyCode : e.which; 
  if(tecla == 13) 
    $("#send").click(); 
}

//Función utilizada para mandar susurros
//----Function used to send whispers
function sendWhisper(otherEasyrtcid) {
    var text = document.getElementById('sendMessageText').value;
    if(text.replace(/\s/g, "").length === 0) {
        return;
    }

    //Se pone 'whisper' como tipo de mensaje, para indicar que es un susurro
    //----It puts 'whisper' as the msgType, to indicate that it is a whisper
    easyrtc.sendDataWS(otherEasyrtcid, "whisper",  text);
    addToConversation("Me", "whisper", text);
    document.getElementById('sendMessageText').value = "";
}

//Función que realiza el envío del mensaje por la sala
//----Function that makes the broadcast in the room
function sendRoomMessage(roomName){
    var text = document.getElementById('sendMessageText').value;
    if(text.replace(/\s/g, "").length === 0) {
        return;
    }

    //Crea el objeto que se va a utilizar para almacenar el nombre de la sala
    //----It creates the object that is going to be used to store the room name
    var dest = {};
    dest.targetRoom = roomName;

    //Función que envía el mensaje a la sala indicada
    //----Function that sends the message to the given room
    easyrtc.sendDataWS(dest, "global", text, function(reply) {
        if (reply.msgType === "error") {
            easyrtc.showError(reply.msgData.errorCode, reply.msgData.errorText);
        }
    });

    addToConversation("Me", "global", text);
    document.getElementById('sendMessageText').value = "";
}

//Función para mover el scroll del textarea siempre al final
//----Function that move the scroll of the textarea allways to the last line
function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
    }
}

//Función que divide el texto introducido en palabras y lo formatea
//----This function splits the introduced text into words and formats it
function formatText(sender, content){
    formatedText = "";
    helper = 160 - sender.length;

    textInWords = content.split(' ');

    for(var i = 0; i < textInWords.length; i++){
        if(formatedText.length > helper){
            formatedText += "<br>"
        }
        formatedText += textInWords[i] + " ";
        helper += 160;
    }

    return formatedText;
}

//Función que se ejecuta cada vez que se recibe un mensaje
//----Function that executes each time a user receives a message
function addToConversation(who, msgType, content) {
    //Se escapan los caracteres especiales y se añaden saltos de línea
    //----It scapes the special characters and adds newlines
    content = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    content = content.replace(/\n/g, '<br />');

    var sender = easyrtc.idToName(who);
    var whisper = false;

    //En caso de ser un susurro, pongo 'whisper' a true
    //----If it is a whisper, I set 'whisper' to true
    if(msgType === "whisper")
        whisper = true;

    //Compone el mensaje dependiendo de si es un susurro o si es un mensaje global
    //----It compose the message depending if it is a whisper or a global message
    if(who === 'Me')
        sender = "[Yo]: ";
    else
        sender = "[" + sender + "]: ";

    if(whisper){
        document.getElementById('conversation').innerHTML += "<span class='whisper'>" + sender + content + "</span><br />";
    } else {
        if(who === 'Me'){
            spanClass = 'me';
            spanClassText = 'mytext';
        } else {
            spanClass = 'other';
            spanClassText = 'othertext';
        }

        var formatedText = formatText(sender, content);

        document.getElementById('conversation').innerHTML += "<span class='global'><span class=" + spanClass 
                                    + ">" + sender + "</span><span class=" + spanClassText + ">" + formatedText + "</span></span><br />";
    }
}

//Función que realiza la llamada al otro usuario
//----Function that performs the call to the other user
function performCall(otherEasyrtcid) {
    easyrtc.hangupAll();

    var successCB = function() {};
    var failureCB = function() {};
    easyrtc.call(otherEasyrtcid, successCB, failureCB);
}

//Función para mostrar la sala en la que se encuentra el usuario
//----Function that shows the room where the user is in
function showRoom(){
    for(i in easyrtc.getRoomsJoined()){
        alert(i);
    }
}

//Función que muestra el número de clientes conectados a una sala
//----Functio that shows how many clients are connected to a room
function showOccupants(){
    for(i in easyrtc.getRoomsJoined()){
        alert(data[i].presence.show);
    }
}

//Función que se ejecuta en caso de que se haya realizado bien la conexión
//----Function that is triggered if the connection succeded
function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;

    document.getElementById("me").innerHTML = 
        "Estás conectado como <span class='me'>[" + easyrtc.idToName(selfEasyrtcid) + "]</span>";

    $("#connecting").addClass("undisplayed");
    $("#chooseRoom").removeClass("undisplayed");
}

//Función que se ejecuta en caso de que la función no haya sido satisfactoria
//----Function that is triggered if the connection failed
function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}