var participation = angular.module('participation', []);
participation.controller('EnterCodeCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.code = {};
	$scope.error = null;
	$scope.submitted = false;
	
	// register new user
	$scope.submitcode = function() {
	
		$scope.submitted = true;	
		if ($scope.error && $scope.error.field && $scope.error.type) $scope.myform[$scope.error.field].$setValidity($scope.error.type, true);
		$scope.error = null;
		if (! $scope.myform.$valid) return;
		
		$scope.code.error = null;
		
		// send the request
		var data = $scope.code;		
		
		$http.post(jsRoutes.controllers.members.Studies.enterCode().url, JSON.stringify(data)).
			success(function(data) { 
				window.location.replace(portalRoutes.controllers.MemberFrontend.studydetails(data.study).url); 
			}).
			error(function(err) {
				$scope.error = err;
				if (err.field && err.type) $scope.myform[err.field].$setValidity(err.type, false);				
			});
	}
}]);
participation.controller('ListStudiesCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.results =[];
	$scope.error = null;
	$scope.loading = true;
	
	$scope.reload = function() {
			
		$http.get(jsRoutes.controllers.members.Studies.list().url).
			success(function(data) { 				
				$scope.results = data;
				$scope.loading = false;
				$scope.error = null;
			}).
			error(function(err) {
				$scope.error = err;				
			});
	};
	
	$scope.reload();
	
}]);
participation.controller('StudyDetailCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.studyid = window.location.pathname.split("/")[2];
	$scope.study = {};
	$scope.participation = {};
	$scope.loading = true;
	$scope.error = null;
		
	$scope.reload = function() {
			
		$http.get(jsRoutes.controllers.members.Studies.get($scope.studyid).url).
			success(function(data) { 				
				$scope.study = data.study;
				$scope.participation = data.participation;
				$scope.research = data.research;
				$scope.loading = false;
				$scope.error = null;
			}).
			error(function(err) {
				$scope.error = err;				
			});
	};
	
	$scope.needs = function(what) {
		return $scope.study.requiredInformation && $scope.study.requiredInformation == what;
	}
	
	$scope.mayRequestParticipation = function() {
		return ( $scope.participation.status == "MATCH" || $scope.participation.status == "CODE" );
	};
	
	$scope.mayDeclineParticipation = function() {
		return ( $scope.participation.status == "MATCH" || $scope.participation.status == "CODE" );
	};
	
	$scope.requestParticipation = function() {
		$scope.error = null;
		
		$http.post(jsRoutes.controllers.members.Studies.requestParticipation($scope.studyid).url).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.noParticipation = function() {
		$scope.error = null;
		
		$http.post(jsRoutes.controllers.members.Studies.noParticipation($scope.studyid).url).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.reload();
	
}]);