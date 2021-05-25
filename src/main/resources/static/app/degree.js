var app = angular.module("degree", []);
app.controller('degreeController', ['$scope', '$sce', '$http', function ($scope, $sce, $http) {
    $scope.sce = $sce;
    $scope.aboutText = 'Данный чат не записывает сообщения в базу данных, не требует регистрации и имеет функцию шифрования.' +
        '<p><a class ="about-ref" href ="https://ru.wikipedia.org/wiki/Шифр_Вернама">Для обеспечения защиты сообщений используется шифр ' +
        'Вернама. Данный шифр имеет абсолютную криптографическую стойкость, доказанную Клодом Шенноном. Стойкость достигается за счет ' +
        'независимости шифротекстов и открытых ключей в системе.<a/></p>' +
        '<p>Обязатльным условием защищенности является длина ключа, равная или большая чем длина отправляемого сообщения. Также не забывайте про регулярную смену ключа.</p>'
    var stompClient = null;
    var isAbout = false;
    var isLogin = false;
    $scope.nickname = '';
    $scope.inputMessage = '';
    $scope.secretKey = '';
    $scope.serverMessages = true;
    var selectedUser = '';
    var messages = [];
    var users = [];

    this.about = function () {
        isAbout = !isAbout;
    }

    this.isAbout = function () {
        return isAbout;
    }

    this.isLogin = function () {
        return isLogin;
    }

    this.isUsers = function () {
        return users.length > 0;
    }

    this.getUsers = function () {
        if(!users.length > 0) {
            return users;
        }
        let displayUsers = [];
        users.forEach(function(entry) {
            displayUsers.push(entry);
        });
        return displayUsers;
    }

    this.selectUser = function (user) {
        selectedUser = user;
    }

    this.isUserSelected = function () {
        return selectedUser !== '';
    }

    this.getSelectedUser = function () {
        return selectedUser;
    }

    this.isMessages = function () {
        return messages.length > 0;
    }

    this.changeServerMessages = function () {
        $scope.serverMessages = !$scope.serverMessages;
    }

    this.getMessages = function () {
        if(!$scope.serverMessages) {
            let msgs = []
            messages.forEach(function(msg) {
                if(msg.from !== 'server')
                    msgs.push(msg);
            });
            this.scrollToBottom();
            return msgs;
        }
        this.scrollToBottom();
        return messages;
    }

    $scope.addMessage = function (message) {
        messages.push(message);
        $scope.$digest();
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
                        $scope.addMessage(JSON.parse(output.body));
                    });

                    stompClient.subscribe('/topic/active', function () {
                        $scope.updateUsers();
                    });

                    stompClient.subscribe('/user/queue/messages', function (output) {
                        $scope.addMessage(JSON.parse(output.body));
                    });
                    $scope.sendConnection(' в сети');
                }, function (err) {
                    console.log('error ', err);
                });
                isLogin = true;
            }, function (response) {
                console.log('Oops ', response);
            });
    }

    this.out = function () {
        if (stompClient != null) {
            $.post('/degree/user-disconnect',
                { username: $scope.nickname },
                function() {
                    $scope.sendConnection(' вышел');

                    stompClient.disconnect(function() {
                        console.log('disconnected...');
                    });
                    isLogin = false;
                });
        }
    }

    $scope.sendConnection = function (message) {
        var text = $scope.nickname + message;
        stompClient.send("/app/broadcast", {}, JSON.stringify({'from': 'server', 'text': text}));

        this.updateUsers();
    }

    $scope.updateUsers = function () {
        $http.get('/degree/active-users-except/' + $scope.nickname)
            .then(function(userList) {
                users = userList.data;
            }, function(response) {
                console.log('Oops ', response);
            });
    }

    this.send = function () {
        if (selectedUser === '') {
            alert('Выберите, кому будет адресовано сообщение');
            return;
        }

        let text = this.encryption($scope.inputMessage);

        stompClient.send("/app/chat", {'sender': $scope.nickname},
            JSON.stringify({'from': $scope.nickname, 'text': text, 'recipient': selectedUser}));
        $scope.inputMessage = '';
    }

    this.clearMessages = function () {
        messages = [];
    }

    this.encryption = function (text) {
        if($scope.secretKey !== '') {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                let j = i;
                if ($scope.secretKey.length <= i) {
                    j = this.encryptionService(i, $scope.secretKey.length, 1);
                }
                result += String.fromCharCode(text.charCodeAt(i) ^ $scope.secretKey.charCodeAt(j));
            }
            return result;
        }
        else {
            return text;
        }
    }

    this.encryptionService = function (i, length, number) {
        let result = i - length * number;
        if(result >= 0 && result < length) {
            return result;
        }
        else {
            this.encryptionService(i, length, ++number);
        }
    }

    this.decrypt = function (message) {
        alert(this.encryption(message));
    }

    this.scrollToBottom = function () {
        var div = document.getElementById('messagesDiv');
        div.scrollTop = div.scrollHeight - div.clientHeight;
    }
}]);
