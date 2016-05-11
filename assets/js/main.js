(function(angular) {
	'use strict';

	var app = angular.module('blink', ['pathgather.popeye', 'ngAnimate', 'ngRoute']);

	app.service('ngrokService', function(){
		var ngrok = {
			id: localStorage['ngrokId']
		}

		return ngrok;
	});

	app.service('notificationService', ['$timeout', function($timeout) {
		var vm = this;
		vm.displayMessage = displayMessage;
		vm.reset = reset;
		vm.error = false;

		var timer;
		reset();

		function displayMessage(status, type, code) {
			var ending = '';
			if (status === 404) {
				vm.message = 'Oh no! Tim can\'t hear you!';
			} else {
				if (type === 'action') {
					if (code.substr(code.length -1) === 'e') {
						ending = 'd';
					} else {
						ending = 'ed';
					}
					vm.message = 'You ' + code + ending + ' Tim!';
				} else if (type === 'emotion') {
					vm.message = 'You are ' + code + '!';
				} else if (type === 'morse') {
					vm.message = code;
				}
			}

			$timeout.cancel(timer);
			timer = $timeout(reset, 5000);
		}

		function reset() {
			vm.message = '';
		}
	}]);

	app.config(['$routeProvider', function($routeProvider) {

		$routeProvider
			.when('/morse', {
				templateUrl: '/templates/morse-coder.html'
			})
			.when('/home', {
				templateUrl: '/templates/annoyer.html'
			})
			.otherwise({
				redirectTo: '/home'
			});
	}]);

	app.controller('modalCtrl', [
		'$scope',
		'ngrokService',
		function(
			$scope,
			ngrokService
		){
			var vm = this;
			vm.ngrok = ngrokService;
	}]);

	app.controller('generalCtrl', function() {
		var vm = this;
		vm.location = '';
		vm.getLocationId = getLocationId;

		getLocationId(window.location.href);

		function getLocationId(url) {
			vm.location = url.split('/').pop();
			return url.split('/').pop();
		}


	});

	app.controller('annoyCtrl', [ 
		'$scope', 
		'$http', 
		'notificationService',
		'ngrokService',
		'Popeye',
		function(
			$scope, 
			$http,
			notificationService,
			ngrokService,
			Popeye
		){
			var vm = this;
			vm.ngrok = ngrokService;
			vm.notification = notificationService;
			vm.triggerEmotion = triggerEmotion;
			vm.triggerAction = triggerAction;
			vm.keyTrigger = keyTrigger;
			vm.settingsModal = settingsModal;

			function settingsModal() {
				var modal = Popeye.openModal({
					templateUrl: 'templates/modal.html',
					controller: 'modalCtrl as modal'
				});

				modal.closed.then(function() {
					localStorage['ngrokId'] = vm.ngrok.id;
				});
			}

			//window.addEventListener('keyup', keyTrigger, false);

			function keyTrigger(event) {
				switch(event.keyCode) {
					case 65:
						triggerAction('poke');
						break;
					case 83:
						triggerAction('punch');
						break;
					case 68:
						triggerAction('cheer');
						break;
					case 70:
						triggerAction('alert');
						break;
					case 74:
						triggerAction('walk');
						break;
					case 75:
						triggerAction('kitchen');
						break;
					case 76:
						triggerAction('lunch');
						break;
					case 49:
						triggerEmotion('happy');
						break;
					case 50:
						triggerEmotion('laughing');
						break;
					case 51:
						triggerEmotion('sad');
						break;
					case 52:
						triggerEmotion('mad');
						break;
					case 53:
						triggerEmotion('sleepy');
						break;
					case 54:
						triggerEmotion('bored');
						break;
					default:
						console.error('invalid keystroke');
				}
			}

			function triggerEmotion(emotion) {
				var repeat, color;
				var time = 1;
				switch(emotion) {
					case 'happy':
						repeat = 2;
						color = 'FFFD73'; // yellow
						break;
					case 'sad':
						repeat = 2;
						color = '5177F5'; // blue
						break;
					case 'laughing':
						time = .2;
						repeat = 3;
						color = 'FF9EA8'; // pink
						break;
					case 'mad':
						repeat = 2;
						color = 'dd2727'; // red
						break;
					case 'sleepy':
						repeat = 2;
						color = 'b6b6b6'; // grey
						break;
					case 'bored':
						repeat = 2;
						color = '3f940e'; // green
						break;
					default:
						repeat = 1;
						color = '000000'; // none
				}
				$http.get('http://' + vm.ngrok.id + '.ngrok.io/blink1/blink?rgb=%23' + color + '&time=' + time + '&repeats=' + repeat)
					.then(function(response){
						vm.type = 'emotion';
						vm.event = emotion;
						vm.notification.error = false;
						vm.notification.displayMessage(response.status, 'emotion', vm.event);
					}, function(response){
						vm.type = 'emotion';
						vm.event = emotion;
						vm.notification.error = true;
						vm.notification.displayMessage(404);
					});
			}

			function triggerAction(action) {
				var time, repeat;
				var ledn = 0;
				var color = '00eecc'; // teal
				switch(action) {
					case 'poke':
						time = .3;
						repeat = 1;
						ledn = 1;
						break;
					case 'walk':
						time = .7;
						repeat = 3;
						break;
					case 'cheer':
						time = .4;
						repeat = 4;
						break;
					case 'kitchen':
						time = 2;
						repeat = 3;
						break;
					case 'alert':
						time = .2;
						repeat = 5;
						break;
					case 'punch':
						time = .3;
						repeat = 1;
						break;
					case 'lunch':
						time = 3;
						repeat = 1;
						break;
					default:
						color = '000000';
						time = 1;
						repeat = 1;
				}
				$http.get('http://' + vm.ngrok.id + '.ngrok.io/blink1/blink?rgb=%23' + color + '&time=' + time + '&repeats=' + repeat + '&ledn=' + ledn)
					.then(function(response){
						vm.type = 'action';
						vm.event = action;
						vm.notification.error = false;
						vm.notification.displayMessage(response.status, 'action', vm.event);
					}, function(response){
						vm.type = 'action';
						vm.event = action;
						vm.notification.error = true;
						vm.notification.displayMessage(404);
					});
			}

	}]);

	app.controller('morseCtrl', [
		'$scope', 
		'$http',
		'ngrokService',
		'notificationService',
		function(
			$scope, 
			$http,
			ngrokService,
			notificationService
		) {
			var vm = this;
			vm.message = '';
			vm.ngrok = ngrokService;
			vm.notification = notificationService;
			vm.translateMorse = translateMorse;

			function translateMorse(message) {
				$http.get('http://' + vm.ngrok.id + '.ngrok.io/blink1/morse?message=' + message + '&time=.3&rgb=%2366b2b2')
					.then(function(response) {
						vm.code = response.data.code;
						vm.notification.displayMessage(response.status, 'morse', response.data.code);
						vm.message = '';
					}, function(response) {
						vm.notification.error = true;
						vm.notification.displayMessage(404);
						vm.message = '';
					});
			}
		}]);

})(angular);