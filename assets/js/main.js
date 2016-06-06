(function(angular) {
	'use strict';

	var app = angular.module('blink', ['pathgather.popeye', 'ngAnimate', 'ngRoute', 'color.picker']);

	app.service('ngrokService', function(){
		var ngrok = {
			id: localStorage['ngrokId']
		}

		return ngrok;
	});

	app.service('notificationService', ['$timeout', function($timeout) {
		var vm = this;
		vm.displayMessage = displayMessage;
		vm.errorMessage = errorMessage;
		vm.reset = reset;
		vm.error = false;

		var timer;
		reset();

		function displayMessage(status, type, code) {
			var ending = '';
			if (status === 404) {
				if (type === 'morse') {
					vm.message = '. .-. .-. --- .-.';
				} else {
					vm.message = 'Oh no! Tim can\'t hear you!';
				}
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
				} else if (type === 'pattern') {
					vm.message = 'What a pretty pattern!';
				}
			}

			$timeout.cancel(timer);
			timer = $timeout(reset, 5000);
		}

		function errorMessage(error) {
			if (error === 'connection') {
				vm.message = 'Aw, blink isn\'t connected'
			} else if (error === 'time') {
				vm.message = 'Please check your time input!';
			} else if (error === 'repeat') {
				vm.message = 'Please check your repeat input!';
			} else if (error === 'color') {
				vm.message = 'Please make sure your colors are in HEX!'
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
				templateUrl: '/blink1-app/templates/morse-coder.html'
			})
			.when('/home', {
				templateUrl: '/blink1-app/templates/annoyer.html'
			})
			.when('/pattern', {
				templateUrl: '/blink1-app/templates/pattern-builder.html'
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

	app.controller('generalCtrl', [
		'Popeye', 
		'ngrokService', 
		'$scope',
		'$rootScope',
		function(
			Popeye, 
			ngrokService,
			$scope,
			$rootScope
		) {
			var vm = this;
			vm.location = '';
			vm.getLocationId = getLocationId;
			vm.ngrok = ngrokService;
			vm.settingsModal = settingsModal;
			vm.infoModal = infoModal;
			vm.modalActive = false;

			getLocationId(window.location.href);

			function getLocationId(url) {
				vm.location = url.split('/').pop();
				return vm.location;
			}
			
			function settingsModal() {
				$rootScope.modalActive = true;
				var modal = Popeye.openModal({
					templateUrl: 'templates/modal.html',
					controller: 'modalCtrl as modal'
				});

				modal.closed.then(function() {
					$rootScope.modalActive = false;
					localStorage['ngrokId'] = vm.ngrok.id;
				});
			}

			function infoModal() {
				$rootScope.modalActive = true;
				var modal = Popeye.openModal({
					templateUrl: 'templates/info-modal.html'
				});

				modal.closed.then(function() {
					$rootScope.modalActive = false;
				});
			}
	}]);

	app.controller('annoyCtrl', [ 
		'$scope',
		'$rootScope',
		'$http', 
		'notificationService',
		'ngrokService',
		function(
			$scope,
			$rootScope,
			$http,
			notificationService,
			ngrokService
		){
			var vm = this;
			vm.ngrok = ngrokService;
			vm.notification = notificationService;
			vm.triggerEmotion = triggerEmotion;
			vm.triggerAction = triggerAction;
			vm.keyTrigger = keyTrigger;

			window.addEventListener('keyup', keyTrigger, false);

			$scope.$on('$destroy', function () {
				window.removeEventListener('keyup', keyTrigger, false);
			});

			$scope.$watch('modalActive', function(modal){
				if (modal) {
					window.removeEventListener('keyup', keyTrigger, false);
				} else {
					window.addEventListener('keyup', keyTrigger, false);
				}
			});

			function keyTrigger($event) {
				switch($event.keyCode) {
					case 65: // a
						triggerAction('poke');
						break;
					case 83: // s
						triggerAction('punch');
						break;
					case 68: // d
						triggerAction('cheer');
						break;
					case 70: // f
						triggerAction('alert');
						break;
					case 74: // j
						triggerAction('walk');
						break;
					case 75: // k
						triggerAction('kitchen');
						break;
					case 76: // l
						triggerAction('lunch');
						break;
					case 49: // 1
						triggerEmotion('happy');
						break;
					case 50: // 2
						triggerEmotion('laughing');
						break;
					case 51: // 3
						triggerEmotion('sad');
						break;
					case 52: // 4
						triggerEmotion('mad');
						break;
					case 53: // 5
						triggerEmotion('sleepy');
						break;
					case 54: // 6
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
						if (response.data.blink1Connected) {
							vm.notification.error = false;
							vm.notification.displayMessage(response.status, 'emotion', vm.event);
						} else {
							vm.notification.error = true;
							vm.notification.errorMessage('connection');
						}
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
						ledn = 2;
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
						if (response.data.blink1Connected) {
							vm.notification.error = false;
							vm.notification.displayMessage(response.status, 'action', vm.event);
						} else {
							vm.notification.error = true;
							vm.notification.errorMessage('connection');
						}
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
						vm.message = '';
						if (response.data.blink1Connected) {
							vm.notification.error = false;
							vm.notification.displayMessage(response.status, 'morse', response.data.code);
						} else {
							vm.notification.error = true;
							vm.notification.errorMessage('connection');
						}
					}, function(response) {
						vm.notification.error = true;
						vm.notification.displayMessage(404, 'morse');
						vm.message = '';
					});
			}
		}]);

	app.controller('patternCtrl', [
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
			vm.ngrok = ngrokService;
			vm.notification = notificationService;
			vm.time;
			vm.repeat;
			vm.colorList = [];
			vm.colorPattern = '';
			vm.createColorList = createColorList;
			vm.createPattern = createPattern;
			vm.changeColorInputs = changeColorInputs;

			var numColors = document.getElementById('numColors');

			numColors.addEventListener('change', function(){
				changeColorInputs(numColors.value);
			});

			function changeColorInputs(num) {
				for (var i = 1; i <= 6; i++) {
					if (i <= num) {
						document.getElementById('color' + i).classList.remove('hide');
					} else if (!document.getElementById('color' + i).classList.contains('hide')) {
						document.getElementById('color' + i).classList.add('hide');
					}
					
				}
			}

			function createColorList() {
				vm.validColors = true;
				
				var colors = document.querySelectorAll('.color-picker-input');
				for (var i = 0; i < numColors.value; i++) {
					if (colors[i].value.substr(0,1) === '#' && colors[i].value.length === 7) {
						vm.colorList.push('%23' + colors[i].value.substr(1));
					}
				}

				if (vm.colorList.length === 0) {
					vm.validColors = false;
				}
				vm.colorPattern = vm.colorList.join(',');
			}

			function createPattern() {

				if (isNaN(parseFloat(vm.time))) {
					vm.validTime = false;
				} else {
					vm.validTime = true;
				}

				if (isNaN(parseInt(vm.repeat))) {
					vm.validRepeat = false;
				} else {
					vm.validRepeat = true;
				}

				createColorList();

				if (vm.validColors && vm.validTime && vm.validRepeat) {
					$http.get('http://' + vm.ngrok.id + '.ngrok.io/blink1/pattern?rgb=' + vm.colorPattern + '&time=' + vm.time + '&repeats=' + vm.repeat)
						.then(function(response) {
							vm.colorList = [];
							if (response.data.blink1Connected) {
								vm.notification.error = false;
								vm.notification.displayMessage(response.status, 'pattern');
							} else {
								vm.notification.error = true;
								vm.notification.errorMessage('connection');
							}
						}, function(response) {
							vm.colorList = [];
							vm.notification.error = true;
							vm.notification.displayMessage(404, 'pattern');
						});
				} else {
					vm.notification.error = true;
					if (vm.validColors === false) {
						vm.notification.errorMessage('color');
					} else if (vm.validTime === false) {
						vm.notification.errorMessage('time');
					} else if (vm.validRepeat === false) {
						vm.notification.errorMessage('repeat');
					}
				}
			}

		}]);

})(angular);