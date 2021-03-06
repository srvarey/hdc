var views = angular.module('views', ['services']);
views.controller('FlexibleRecordListCtrl', ['$scope', '$http', '$attrs', 'views', 'records', 'status', function($scope, $http, $attrs, views, records, status) {
			
	$scope.records = [];	
	$scope.view = views.getView($attrs.viewid || $scope.def.id);
	$scope.status = new status(true);
	
	
	$scope.reload = function() {		
		if (!$scope.view.active) return;
		$scope.status.doBusy(records.getRecords($scope.view.setup.aps, $scope.view.setup.properties, $scope.view.setup.fields)).
		then(function (result) { $scope.records = result.data; });
	};
	
	$scope.showDetails = function(record) {
		if (!views.updateLinked($scope.view, "record", { id : record.id })) {
		  window.location.href = portalRoutes.controllers.Records.details(record.id).url;
		}
	};
	
	$scope.removeRecord = function(record) {
		$scope.status.doSilent(records.unshare($scope.view.setup.aps, record._id.$oid, $scope.view.setup.type));
		$scope.records.splice($scope.records.indexOf(record), 1);
	};
	
	$scope.shareRecords = function() {
		var selection = _.filter($scope.records, function(rec) { return rec.marked; });
		selection = _.chain(selection).pluck('_id').pluck('$oid').value();
		$scope.status.doSilent(records.share($scope.view.setup.targetAps, selection, $scope.view.setup.type))
		.then(function () {
		   views.changed($attrs.viewid);
		   views.disableView($attrs.viewid);
		});
	};
	
	$scope.addRecords = function() {
		views.updateLinked($scope.view, "shareFrom", 
				 { aps : null, 
			       properties:{}, 
			       fields : $scope.view.setup.fields, 
			       targetAps : $scope.view.setup.aps, 
			       allowShare : true,
			       type : $scope.view.setup.type,
			       sharedRecords : $scope.records
			      });
	};
	
	$scope.$watch('view.setup', function() { $scope.reload(); });	
	
}]);
views.controller('FlexibleStudiesCtrl', ['$scope', '$http', '$attrs', 'views', 'studies', 'status', function($scope, $http, $attrs, views, studies, status) {
	
	$scope.studies = [];	
	$scope.view = views.getView($attrs.viewid || $scope.def.id);
	$scope.status = new status(true);
	
	$scope.reload = function() {		
		if (!$scope.view.active) return;
		$scope.status.doBusy(studies.search($scope.view.setup.properties, $scope.view.setup.fields)).
		then(function (result) { $scope.studies = result.data; });
	};
	
	$scope.showDetails = function(study) {
		window.location.href = portalRoutes.controllers.MemberFrontend.studydetails(study._id.$oid).url;
	};
	
	$scope.$watch('view.setup', function() { $scope.reload(); });	
	
}]);
views.controller('RecordDetailCtrl', ['$scope', '$http', '$attrs', 'views', 'records', 'apps', 'status', function($scope, $http, $attrs, views, records, apps, status) {
		
	$scope.view = views.getView($attrs.viewid || $scope.def.id);
	$scope.record = {};
	$scope.status = new status(true);
	
	$scope.reload = function() {
	   if (!$scope.view.active) return;	
       $scope.status.doBusy(records.getRecord($scope.view.setup.id)).
	   then(function(result) {
			$scope.record = result.data;
			$scope.record.json = JSON.stringify($scope.record.data, null, "\t");
			if (_.has($scope.record.data, "type") && $scope.record.data.type === "file") {
				$scope.downloadLink = jsRoutes.controllers.Records.getFile(recordId).url;
			}
			
			loadUserNames();
			
			apps.getApps({"_id": $scope.record.app}, ["name"]).
			then(function(result) { $scope.record.app = result.data[0].name; });
			
			console.log($scope.record);
			//var split = $scope.record.created.split(" ");
			//$scope.record.created = split[0] + " at " + split[1];
		});
	};
    
    
	var loadUserNames = function() {		
		var data = {"properties": {"_id": [$scope.record.owner, $scope.record.creator]}, "fields": ["firstname", "sirname"]};
		$scope.status.doSilent($http.post(jsRoutes.controllers.Users.getUsers().url, JSON.stringify(data))).
			then(function(result) {				
				_.each(result.data, function(user) {
					if ($scope.record.owner && $scope.record.owner.$oid === user._id.$oid) { $scope.record.owner = (user.firstname+" "+user.sirname).trim(); }
					if ($scope.record.creator && $scope.record.creator.$oid === user._id.$oid) { $scope.record.creator = (user.firstname+" "+user.sirname).trim(); }
				});
				if (!$scope.record.owner) $scope.record.owner = "?";
				if (!$scope.record.creator) $scope.record.creator = "Same as owner";
			});
	};
	
	$scope.$watch('view.setup', function() { $scope.reload(); });	
	
}]);
views.controller('AddRecordsCtrl', ['$scope', '$http', '$attrs', 'views', 'records', 'status', function($scope, $http, $attrs, views, records, status) {
	
	$scope.foundRecords = [];
	$scope.criteria = { query : "" };
	$scope.title = $attrs.title;
	$scope.viewid = $attrs.viewid || $scope.def.id;
	$scope.view = views.getView($scope.viewid);
	$scope.records = [];
	$scope.status = new status(true);
	$scope.newest = true;
	
	$scope.reload = function() {		
		if (!$scope.view.active) return;	
		$scope.foundRecords = [];
		$scope.criteria.query = "";
								
		$scope.searchRecords();
		
		if ($scope.view.setup.sharedRecords != null) $scope.records = _.chain($scope.view.setup.sharedRecords).pluck('_id').value();
	};
			
	$scope.shareRecords = function() {
		var selection = _.filter($scope.foundRecords, function(rec) { return rec.checked; });
		selection = _.chain(selection).pluck('_id').pluck('$oid').value();
		console.log(selection);
		$scope.status.doSilent(records.share($scope.view.setup.targetAps, selection, $scope.view.setup.type))
		.then(function () {
		   views.changed($scope.viewid);
		   views.disableView($scope.viewid);
		});
	};
	
	// check whether record is not already in active space
	$scope.isntInSpace = function(record) {		
		return !$scope.containsRecord($scope.records, record._id);
	};
	
	// helper method for contains
	$scope.containsRecord = function(recordIdList, recordId) {
		var ids = _.map(recordIdList, function(element) { return element.$oid; });
		return _.contains(ids, recordId.$oid);
	};
	
	$scope.showDetails = function(record) {
		if (!views.updateLinked($scope.view, "record", { id : record.id })) {
		  window.location.href = portalRoutes.controllers.Records.details(record.id).url;
		}
	};
	
	// search for records
	$scope.searchRecords = function() {		
		var query = $scope.criteria.query;
		$scope.foundRecords = [];
		
		if (query) {			
			$scope.newest = false;
			$scope.status.doBusy(records.search(query)).
				then(function(results) {
					$scope.error = null;
					$scope.foundRecords = results.data;					
				});
		} else {
			$scope.newest = true;
			
		    $scope.status.doBusy(records.getRecords(null, { "max-age" : 86400 * 31 }, [ "ownerName", "created", "id", "name" ])).
			then(function (result) { 
				$scope.foundRecords = result.data;
				$scope.searching = false; 
			});
		}
	};
	
	$scope.$watch('view.setup', function() { $scope.reload(); });	
	
}]);
views.controller('ListHealthProviderCtrl', ['$scope', '$http', '$attrs', 'views', 'hc', 'status', function($scope, $http, $attrs, views, hc, status) {
	
	$scope.results =[];
	$scope.view = views.getView($attrs.viewid || $scope.def.id);
    $scope.status = new status(true);
	
	$scope.reload = function() {
			
		$scope.status.doBusy(hc.list()).
		then(function(results) { 				
			$scope.results = results.data;				
			$scope.showNewHCRecords();
		});
	};
	
	$scope.confirm = function(memberKey) {
		hc.confirm(memberKey.provider.$oid).then(function() { $scope.reload(); });		
	};
	
	$scope.reject = function(memberKey) {
		hc.reject(memberKey.provider.$oid).then(function() { $scope.reload(); });
	};
	
	$scope.mayReject = $scope.mayConfirm = function(memberKey) {
		return memberKey.status == "UNCONFIRMED";
	};
	
	
	$scope.showNewHCRecords = function() {
		var creators = [];
		var aps = null;
		_.each($scope.results, function(hc) {
			console.log(hc);
			if (hc.provider) {
				creators.push(hc.provider.$oid);
				aps = hc.member.$oid;
			}
		});
		
		if (aps != null) {
		  views.setView("hcrecords", { aps : aps, properties: { "max-age" : 60*60*24*31, "creator" : creators }, fields : [ "creatorName", "created", "id", "name" ]});
		} else {
		  views.disableView("hcrecords");
		}
	};
	
	$scope.showRecords = function(mk) {
		views.setView("records", { aps : mk.aps.$oid, properties: {}, fields : [ "ownerName", "created", "id", "name" ], allowAdd : true, type:"memberkeys"}, mk.name);
	};
	
	$scope.reload();
	
}]);
views.controller('CreateRecordCtrl', ['$scope', '$http', '$attrs', '$sce', 'views', 'status', 'apps', 'currentUser', function($scope, $http, $attrs, $sce, views, status, apps, currentUser) {
	
	$scope.view = views.getView($attrs.viewid || $scope.def.id);
    $scope.status = new status(true);
    $scope.apps = null;
    $scope.showapp = false;    

    currentUser.then(function(userId) { 
    	$scope.userId = userId;
    	$scope.reload(); 
    });
    
    $scope.reload = function() {
    	if (!$scope.view.active || !$scope.userId) return;	
    	
    	var appId = $scope.view.setup.appId;
    	var userId = $scope.view.setup.userId;
    
    	if (appId) {
    		$scope.selectApp(appId);
    	} else {
    		$scope.showAppList();
    	}
    	    	
    };
    
    $scope.selectApp = function(appId, title) {
        $scope.showapp = true;
        // if (title != null) $scope.view.title = title;
        $scope.status.doBusy($http(jsRoutes.controllers.Apps.getUrl(appId))).
		then(function(results) {			
			$scope.url = $sce.trustAsResourceUrl(results.data);
		});
    };
    
    $scope.showAppList = function() {
    	$scope.showapp = false;
    	if (!$scope.apps) $scope.loadAppList();
    };
    
    $scope.loadAppList = function() {
    	$scope.status.doBusy(apps.getAppsOfUser($scope.userId, ["create","oauth1","oauth2"], ["name", "type"]))
    	.then(function(results) {
    	  $scope.apps = results.data;    	  
    	});
    };
	/* 
	$scope.memberUrl = portalRoutes.controllers.ProviderFrontend.member(userId).url;
	console.log($scope.memberUrl);
	
	
	$http(jsRoutes.controllers.Apps.getUrlForMember(appId, userId)).
		success(function(url) {
			$scope.error = null;
			$scope.url = $sce.trustAsResourceUrl(url);
		}).
		error(function(err) { $scope.error = "Failed to load app: " + err; });
	*/
	$scope.$watch('view.setup', function() { $scope.reload(); });
	
}]);
views.controller('ShowSpaceCtrl', ['$scope', '$http', '$attrs', '$sce', 'views', 'status', 'spaces', 'currentUser', function($scope, $http, $attrs, $sce, views, status, spaces, currentUser) {
	
	$scope.view = views.getView($attrs.viewid || $scope.def.id);
    $scope.status = new status(true);
    $scope.spaces = null;
    $scope.showspace = false;    

    currentUser.then(function(userId) { 
    	$scope.userId = userId;
    	$scope.reload(); 
    });
    
    $scope.reload = function() {
    	if (!$scope.view.active || !$scope.userId) return;	
    	
    	var spaceId = $scope.view.setup.spaceId;    	
    
    	if (spaceId) {
    		$scope.selectSpace(spaceId);
    	} else {
    		$scope.showSpaceList();
    	}
    	    	
    };
    
    $scope.selectSpace = function(spaceId, title) {
        $scope.showspace = true;
        // if (title != null) $scope.view.title = title;
        $scope.status.doBusy(spaces.getUrl(spaceId)).
		then(function(results) {			
			$scope.url = $sce.trustAsResourceUrl(results.data);
		});
    };
        
    $scope.showSpaceList = function() {
    	$scope.showspace = false;
    	$scope.loadSpaceList();
    	// if ($scope.spaces == null) { $scope.loadSpaceList(); }
    };
    
    $scope.loadSpaceList = function() {
    	$scope.status.doBusy(spaces.getSpacesOfUser($scope.userId))
    	.then(function(results) {
    	  $scope.spaces = results.data;    	  
    	});
    };
	 
	
	$scope.$watch('view.setup', function() { $scope.reload(); });
	
}]);