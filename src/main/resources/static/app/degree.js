var socket = null;
var stompClient = null;

var app = angular.module("degree", []);
app.controller('degreeController', ['$scope', '$sce', '$http', function ($scope, $sce, $http) {
    $scope.sce = $sce;
    $scope.aboutText = 'Данный чат не записывает сообщения в базу данных, не требует регистрации и имеет функцию шифрования' +
        '<p><a class ="about-ref" href ="https://ru.wikipedia.org/wiki/Шифр_Вернама">Для обеспечения защиты сообщений используется шифр ' +
        'Вернама. Данный шифр имеет абсолютную криптографическую стойкость, доказанную Клодом Шенноном. Стойкость достигается за счет ' +
        'независимости шифротекстов и открытых ключей в системе.<a/></p>' +
        '<p>Обязатльным условием защищенности является длина ключа, равная или большая чем длина отправляемого сообщения. Также не забывайте про регулярную смену ключа.</p>'
    var isAbout = false;
    var isLogin = false;
    $scope.nickname = '';
    var messages = [];

    this.about = function () {
        isAbout = !isAbout;
    }

    this.isAbout = function () {
        return isAbout;
    }

    this.isLogin = function () {
        return isLogin;
    }

    this.login = function () {
        if ($scope.nickname === '') {
            alert('Необходимо ввести никнейм');
            return false;
        }

        $http.post('/degree/user-connect', $scope.nickname)
            .then(function (remoteAddr, status, xhr) {
                var socket = new SockJS('/chat');
                stompClient = Stomp.over(socket);
                stompClient.connect({username: $scope.nickname}, function () {
                    stompClient.subscribe('/topic/broadcast', function (output) {
                        messages.push(JSON.parse(output.body));
                        // showMessage(createTextNode(JSON.parse(output.body)));
                    });

                    stompClient.subscribe('/topic/active', function () {
                        updateUsers($scope.nickname);
                    });

                    stompClient.subscribe('/user/queue/messages', function (output) {
                        messages.push(JSON.parse(output.body));
                        // showMessage(createTextNode(JSON.parse(output.body)));
                    });
                }, function (err) {
                    console.log('error ', err);
                });
            }, function (response) {
                console.log('Oops ', response);
            });
        this.sendConnection(' connected to server');
        isLogin = true;
    }

    this.out = function () {
        if (stompClient != null) {
            $.post('/degree/user-disconnect',
                { username: $scope.nickname },
                function() {
                    sendConnection(' disconnected from server');

                    stompClient.disconnect(function() {
                        console.log('disconnected...');
                    });
                    isLogin = false;
                });
        }
    }

    this.sendConnection = function (message) {
        var text = $scope.nickname + message;
        stompClient.send("/app/broadcast", {}, JSON.stringify({'from': 'server', 'text': text}));

        // for first time or last time, list active users:
        updateUsers($scope.nickname);
    }

}]);

var selectedUser = null;
var username = null;

function outService() {

}

function send() {
    var text = $("#message").val();
    if (selectedUser == null) {
        alert('Please select a user.');
        return;
    }
    stompClient.send("/app/chat", {'sender': username},
        JSON.stringify({'from': username, 'text': text, 'recipient': selectedUser}));
    $("#message").val("");
}

function createTextNode(messageObj) {
    var classAlert = 'alert-info';
    var fromTo = messageObj.from;
    var addTo = fromTo;

    if (username == messageObj.from) {
        fromTo = messageObj.recipient;
        addTo = 'to: ' + fromTo;
    }

    if (username != messageObj.from && messageObj.from != "server") {
        classAlert = "alert-warning";
    }

    if (messageObj.from != "server") {
        addTo = '<a href="javascript:void(0)" onclick="setSelectedUser(\'' + fromTo + '\')">' + addTo + '</a>'
    }
    return '<div class="row alert ' + classAlert + '"><div class="col-md-8">' +
        messageObj.text +
        '</div><div class="col-md-4 text-right"><small>[<b>' +
        addTo +
        '</b> ' +
        messageObj.time +
        ']</small>' +
        '</div></div>';
}

function showMessage(message) {
    $("#content").html($("#content").html() + message);
    $("#clear").show();
}

function clearMessages() {
    $("#content").html("");
    $("#clear").hide();
}

function setSelectedUser(username) {
    selectedUser = username;
    $("#selectedUser").html(selectedUser);
    if ($("#selectedUser").html() == "") {
        $("#divSelectedUser").hide();
    } else {
        $("#divSelectedUser").show();
    }
}

function updateUsers(username) {
    // console.log('List of users : ' + userList);
    var activeUserSpan = $("#active-users-span");
    var activeUserUL = $("#active-users");

    var index;
    activeUserUL.html('');

    var url = '/degree/active-users-except/' + username;
    $.ajax({
        type: 'GET',
        url: url,
        // data: data,
        dataType: 'json', // ** ensure you add this line **
        success: function (userList) {
            if (userList.length == 0) {
                activeUserSpan.html('<p><i>No active users found.</i></p>');
            } else {
                activeUserSpan.html('<p class="text-muted">click on user to begin chat</p>');

                for (index = 0; index < userList.length; ++index) {
                    if (userList[index] != username) {
                        activeUserUL.html(activeUserUL.html() + createUserNode(userList[index], index));
                    }
                }
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert("error occurred");
        }
    });
}

function createUserNode(username, index) {
    return '<li class="list-group-item">' +
        '<a class="active-user" href="javascript:void(0)" onclick="setSelectedUser(\'' + username + '\')">' + username + '</a>' +
        '</li>';
}
