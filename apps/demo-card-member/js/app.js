var jsonRecords = angular.module('jsonRecords', []);
jsonRecords.controller('CreateCtrl', ['$scope', '$http', '$location', '$filter',
	function($scope, $http, $location, $filter) {
		
		// init
		$scope.errors = {};
		$scope.data = {};

		// get authorization token
		var authToken = $location.path().split("/")[1];		
		
		// controller functions
		$scope.validate = function() {
			$scope.loading = true;
			$scope.errors = {};
			$scope.validateField("bloodpressureDia");
			$scope.validateField("bloodpressureSys");
			$scope.validateField("weight");
			$scope.validateField("heartrate");
			
			if(!$scope.errors.bloodpressureDia && !$scope.errors.bloodpressureSys && !$scope.errors.weight && !$scope.errors.heartrate) {
				$scope.submit()
			} else {
				$scope.loading = false;
			}
		};
		
		$scope.validateField = function(field) {
			$scope.errors[field] = null;
			if (!$scope.data[field]) {
				$scope.errors[field] = "Please provide this input field.";
			} 
		};
		
		
		$scope.submit = function() {
			// construct json
			var data = {
				"authToken": authToken,
				"data": JSON.stringify($scope.data),
				"name": "Kardiologischer Record 1 ("+$filter('date')(new Date(), 'yyyy-MM-dd')+")",
				"description": "Kardiologischer Record 1",
				"format" : "cardio1/demo-card"
			};
			
			// submit to server
			$http.post("https://" + window.location.hostname + ":9000/api/apps/create", data).
				success(function() {
					$scope.success = "Record created successfully.";
					$scope.title = null;
					$scope.description = null;
					$scope.data = null;
					$scope.loading = false;
				}).
				error(function(err) {
					$scope.success = null;
					$scope.errors.server = err;
					$scope.loading = false;
				});
		};
		
	}
]);
