(function(angular) {
	'use strict';

	var app = angular.module('blink', ['pathgather.popeye', 'ngAnimate']);

	app.service('ngrokService', function(){
		var ngrok = {
			id: localStorage['ngrokId']
		}

		return ngrok;
	});

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

	app.controller('annoyCtrl', [ 
		'$scope', 
		'$http', 
		'$timeout',
		'ngrokService',
		'Popeye',
		function(
			$scope, 
			$http,
			$timeout,
			ngrokService,
			Popeye
		){
			var vm = this;
			vm.ngrok = ngrokService;
			vm.triggerEmotion = triggerEmotion;
			vm.triggerAction = triggerAction;
			vm.keyTrigger = keyTrigger;
			vm.displayMessage = displayMessage;
			vm.settingsModal = settingsModal;
			vm.reset = reset;
			vm.error - false;
			
			var timer;
			reset();

			function settingsModal() {
				var modal = Popeye.openModal({
					templateUrl: 'modal.html',
					controller: 'modalCtrl as modal'
				});

				modal.closed.then(function() {
					localStorage['ngrokId'] = vm.ngrok.id;
				});
			}

			//check for syntax
			window.addEventListener('keyup', keyTrigger, false);

			function keyTrigger(event) {
				console.log(event.keyCode);
				//find keycodes
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
						console.log('invalid keystroke');
				}
			}

			function displayMessage(status) {
				var ending = '';
				if (status === 404) {
					vm.message = 'Oh no! Tim can\'t hear you!';
				} else {
					if (vm.type === 'action') {
						if (vm.event.substr(vm.event.length -1) === 'e') {
							ending = 'd';
						} else {
							ending = 'ed';
						}
						vm.message = 'You ' + vm.event + ending + ' Tim!';
					} else if (vm.type === 'emotion') {
						vm.message = 'You are ' + vm.event + '!';
					}
				}

				$timeout.cancel(timer);
				timer = $timeout(reset, 5000);
			}

			function reset() {
				vm.message = '';
				vm.type = '';
				vm.event = '';
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
						console.log('success');
						vm.type = 'emotion';
						vm.event = emotion;
						displayMessage();
						vm.response = response.data;
					}, function(response){
						console.log('fail');
						vm.type = 'emotion';
						vm.event = emotion;
						if (response.status === 404) {
							vm.error = true;
							displayMessage(404);
						} else {
							displayMessage();
						}
						vm.response = response.data;
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
						console.log('success');
						vm.type = 'action';
						vm.event = action;
						displayMessage();
						vm.response = response.data;
					}, function(response){
						console.log('fail');
						vm.type = 'action';
						vm.event = action;
						if (response.status === 404) {
							vm.error = true;
							displayMessage(404);
						} else {
							displayMessage();
						}
						vm.response = response.data;
					});
			}

	}]);

})(angular);