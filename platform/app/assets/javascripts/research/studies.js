var studies = angular.module('studies', [ 'services', 'views', 'dashboards' ]);
studies.controller('CreateStudyCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.study = {};
	$scope.error = null;
	$scope.submitted = false;
	
	// register new user
	$scope.createstudy = function() {
	
		$scope.submitted = true;	
		if ($scope.error && $scope.error.field && $scope.error.type) $scope.myform[$scope.error.field].$setValidity($scope.error.type, true);
		$scope.error = null;
		if (! $scope.myform.$valid) return;
						
		// send the request
		var data = $scope.study;		
		
		$http.post(jsRoutes.controllers.research.Studies.create().url, JSON.stringify(data)).
			success(function(result) { window.location.replace(portalRoutes.controllers.ResearchFrontend.studyoverview(result._id.$oid).url); }).
			error(function(err) {
				$scope.error = err;
				if (err.field && err.type) $scope.myform[err.field].$setValidity(err.type, false);				
			});
	}
	
}]);
studies.controller('ListStudiesCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.results =[];
	$scope.error = null;
	$scope.loading = true;
	
	$scope.reload = function() {
			
		$http.get(jsRoutes.controllers.research.Studies.list().url).
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
studies.controller('OverviewCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.studyid = window.location.pathname.split("/")[3];
	$scope.study = {};
	$scope.error = null;
	$scope.loading = true;
		
	$scope.reload = function() {
			
		$http.get(jsRoutes.controllers.research.Studies.get($scope.studyid).url).
			success(function(data) { 				
				$scope.study = data;
				$scope.loading = false;
				$scope.error = null;
			}).
			error(function(err) {
				$scope.error = err;				
			});
	};
	
	$scope.readyForValidation = function() {
		return $scope.study.validationStatus == "DRAFT" || $scope.study.validationStatus == "REJECTED";
	};
	
	$scope.readyForParticipantSearch = function() {
		return $scope.study.validationStatus == "VALIDATED" &&
		       $scope.study.executionStatus == "PRE" &&
		       (
				 $scope.study.participantSearchStatus == "PRE" ||
				 $scope.study.participantSearchStatus == "CLOSED"
			   );
	};
	
	$scope.readyForEndParticipantSearch = function() {
		return $scope.study.validationStatus == "VALIDATED" && $scope.study.participantSearchStatus == "SEARCHING";
	};
	
	$scope.readyForStartExecution = function() {
		return $scope.study.validationStatus == "VALIDATED" && 
		       $scope.study.participantSearchStatus == "CLOSED" &&
		       $scope.study.executionStatus == "PRE";
	};
	
	$scope.startValidation = function() {
		$scope.error = null;
		
		$http.post(jsRoutes.controllers.research.Studies.startValidation($scope.studyid).url).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.startParticipantSearch = function() {
		$scope.error = null;
		
		$http.post(jsRoutes.controllers.research.Studies.startParticipantSearch($scope.studyid).url).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.endParticipantSearch = function() {
		$scope.error = null;
		
		$http.post(jsRoutes.controllers.research.Studies.endParticipantSearch($scope.studyid).url).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.startExecution = function() {
		$scope.error = null;
		
		$http.post(jsRoutes.controllers.research.Studies.startExecution($scope.studyid).url).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.reload();
	
}]);
studies.controller('CodesCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.studyid = window.location.pathname.split("/")[3];
	$scope.codes = null;
	$scope.newcodes = { count:1, reuseable:true, group:"" };
	$scope.loading = true;
	$scope.createnew = false;
	$scope.blocked = false;
	$scope.submitted = false;
	$scope.error = null;
		
	$scope.reload = function() {
			
		$http.get(jsRoutes.controllers.research.Studies.listCodes($scope.studyid).url).
			success(function(data) { 				
				$scope.codes = data;
				$scope.loading = false;
				$scope.createnew = false;
				$scope.error = null;
			}).
			error(function(err) {
				$scope.error = err;
				$scope.blocked = true;
				$scope.createnew = false;
			});
	};
	
	$scope.generate = function() {
		$scope.submitted = true;	
		if ($scope.newcodes.error && $scope.newcodes.error.field && $scope.newcodes.error.type) $scope.myform[$scope.newcodes.error.field].$setValidity($scope.newcodes.error.type, true);
		$scope.newcodes.error = null;
		if (! $scope.myform.$valid) return;
		
		$scope.newcodes.error = null;
		
		// send the request
		var data = $scope.newcodes;		
		
		$http.post(jsRoutes.controllers.research.Studies.generateCodes($scope.studyid).url, JSON.stringify(data)).
			success(function(url) { $scope.reload(); }).
			error(function(err) {
				$scope.newcodes.error = err;
				if (err.field && err.type) $scope.myform[err.field].$setValidity(err.type, false);			
			});
	};
	
	$scope.reload();
	
}]);
studies.controller('ListParticipantsCtrl', ['$scope', '$http', function($scope, $http) {
	
	$scope.studyid = window.location.pathname.split("/")[3];
	$scope.results =[];
	$scope.error = null;
	$scope.loading = true;
	
	$scope.reload = function() {
			
		$http.get(jsRoutes.controllers.research.Studies.listParticipants($scope.studyid).url).
			success(function(data) { 				
				$scope.results = data;
				$scope.loading = false;
				$scope.error = null;
			}).
			error(function(err) {
				$scope.error = err;				
			});
	};
	
	
	$scope.mayApproveParticipation = function(participation) {
	   return participation.status == "REQUEST";
	
	};
	
    $scope.mayRejectParticipation = function(participation) {
      return participation.status == "REQUEST";
	};
	
	
	$scope.rejectParticipation = function(participation) {
		$scope.error = null;
		var params = { member : participation._id.$oid };
		
		$http.post(jsRoutes.controllers.research.Studies.rejectParticipation($scope.studyid).url, params).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.approveParticipation = function(participation) {
		$scope.error = null;
		console.log(participation);
		var params = { member : participation._id.$oid };
		
		$http.post(jsRoutes.controllers.research.Studies.approveParticipation($scope.studyid).url, params).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});
	};
	
	$scope.reload();
	
}]);
studies.controller('ParticipantCtrl', ['$scope', '$http', 'views', function($scope, $http, views) {
	
	$scope.studyid = window.location.pathname.split("/")[3];
	$scope.memberid = window.location.pathname.split("/")[5];
	$scope.member = {};
	$scope.participation = {};
	$scope.loading = true;
		
	views.link("1", "record", "record");
	
	$scope.reload = function() {
			
		views.setView("1", { aps : $scope.memberid, properties : { } , fields : [ "ownerName", "created", "id", "name" ]});
		
		$http.get(jsRoutes.controllers.research.Studies.getParticipant($scope.studyid, $scope.memberid).url).
			success(function(data) { 								
				$scope.participation = data.participation;
				$scope.member = data.member;
				$scope.loading = false;
								
			}).
			error(function(err) {
				$scope.error = err;				
			});
	};
		
	$scope.reload();
	
}]);
studies.controller('RequiredInformationCtrl', ['$scope', '$http', function($scope, $http) {
   $scope.information = {};
   $scope.studyid = window.location.pathname.split("/")[3];	
   $scope.error = null;
   $scope.loading = true;
   
   $scope.reload = function() {
	   
	   $http.get(jsRoutes.controllers.research.Studies.getRequiredInformationSetup($scope.studyid).url).
		success(function(data) { 								
			$scope.information = data;			
			$scope.loading = false;
			$scope.error = null;
		}).
		error(function(err) {
			$scope.error = err;				
		});
   };
   
   $scope.setRequiredInformation = function() {
	   var params = $scope.information;
	   
	   $http.post(jsRoutes.controllers.research.Studies.setRequiredInformationSetup($scope.studyid).url, params).
		success(function(data) { 				
		    $scope.reload();
		}).
		error(function(err) {
			$scope.error = err;			
		});  
   };
   
   $scope.reload();
}]);
