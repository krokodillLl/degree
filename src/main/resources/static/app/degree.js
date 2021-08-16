var app = angular.module("degree", []);
app.controller('degreeController', ['$scope', '$sce', '$http', function ($scope, $sce, $http) {
    $scope.sce = $sce;
    $scope.aboutText = 'Данный чат не записывает сообщения в базу данных, не требует регистрации и имеет функцию шифрования.' +
        '<p><a class ="about-ref" href ="https://ru.wikipedia.org/wiki/Шифр_Вернама" title="_blank">Для обеспечения защиты сообщений используется шифр ' +
        'Вернама. Данный шифр имеет абсолютную криптографическую стойкость, доказанную Клодом Шенноном. Стойкость достигается за счет ' +
        'независимости шифротекстов и открытых ключей в системе.<a/></p>' +
        '<p>Обязатльным условием защищенности является длина ключа, равная или большая длине отправляемого сообщения. Также не забывайте про регулярную смену ключа.</p>'
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
    var stickers = [];
    var isSelectStickers = false;

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
        return users.length > 1;
    }

    this.isStickers = function () {
        return stickers.length > 1;
    }

    this.getStickers = function () {
        return stickers;
    }

    this.changeIsSelectedStickers = function () {
        isSelectStickers = !isSelectStickers;
    }

    this.isShowStickers = function () {
        return isSelectStickers;
    }

    this.getMessageStyle = function (from) {
        let style = '';
        if(from === 'server') {
            style = "alert-light";
        }
        else if(from === $scope.nickname) {
            style = "alert-secondary";
        }
        else {
            style = "alert-dark";
        }
        return style;
    }

    $scope.downloadStickers = function () {
        $http.get('/degree/stickers')
            .then(function (response) {
                stickers = response.data;
            }, function (response) {
                console.log('Oops ', response);
            });
    }

    this.selectSticker = function (sticker) {
        this.send(sticker);
    }

    this.getUsers = function () {
        if (!users.length > 0) {
            return users;
        }
        let displayUsers = [];
        users.forEach(function (user) {
            if (user !== $scope.nickname) {
                displayUsers.push(user);
            }
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
        if (!$scope.serverMessages) {
            let msgs = []
            messages.forEach(function (msg) {
                if (msg.from !== 'server') {
                    msgs.push(msg);
                }
            });
            this.scrollToBottom();
            return msgs;
        }
        this.scrollToBottom();
        return messages;
    }

    this.isSticker = function (text) {
        if (stickers.length > 0) {
            return stickers.indexOf(text) !== -1;
        }
        return false;
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
        $scope.updateUsers($scope.nickname);
    }

    $scope.loginService = function () {
        if (users.indexOf($scope.nickname) !== -1) {
            alert('Данный никнейм уже используется');
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
                $scope.downloadStickers();
                isLogin = true;
            }, function (response) {
                console.log('Oops ', response);
            });
    }

    this.out = function () {
        if (stompClient != null) {
            $http.post('/degree/user-disconnect', $scope.nickname).then(function () {
                stompClient.disconnect(function () {
                    console.log('disconnected...');
                });
                stompClient = null;
                isAbout = false;
                isLogin = false;
                $scope.nickname = '';
                $scope.inputMessage = '';
                $scope.secretKey = '';
                $scope.serverMessages = true;
                selectedUser = '';
                messages = [];
            });
        }
    }

    $scope.sendConnection = function (message) {
        var text = $scope.nickname + message;
        stompClient.send("/app/broadcast", {}, JSON.stringify({'from': 'server', 'text': text}));

        this.updateUsers();
    }

    $scope.updateUsers = function (user) {
        $http.get('/degree/active-users/')
            .then(function (userList) {
                users = userList.data;
                if (user) {
                    $scope.loginService();
                }
            }, function (response) {
                console.log('Oops ', response);
            });
    }

    this.send = function (message) {
        if (selectedUser === '') {
            alert('Выберите, кому будет адресовано сообщение');
            return;
        }

        let text = message ? message : this.encryption($scope.inputMessage);

        stompClient.send("/app/chat", {'sender': $scope.nickname},
            JSON.stringify({'from': $scope.nickname, 'text': text, 'recipient': selectedUser}));
        $scope.inputMessage = '';
    }

    this.clearMessages = function () {
        messages = [];
    }

    this.encryption = function (text) {
        if ($scope.secretKey !== '') {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                let j = i;
                if ($scope.secretKey.length <= i) {
                    j = this.encryptionService(i, $scope.secretKey.length, 1);
                }
                result += String.fromCharCode(text.charCodeAt(i) ^ $scope.secretKey.charCodeAt(j));
            }
            return result;
        } else {
            return text;
        }
    }

    this.encryptionService = function (i, length, number) {
        let result = i - length * number;
        if (result >= 0 && result < length) {
            return result;
        } else {
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
}
]);
