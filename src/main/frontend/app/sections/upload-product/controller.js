/* 
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016 Serco Spa
 * 
 * This file is part of DHuS software sources.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
(function () { 'use strict'; }());
angular.module('DHuS-webclient').directive('fileModel', ['$parse', function ($parse) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var modelSetter = $parse(attrs.fileModel).assign;
			element.bind('change', function () {
				scope.$apply(function () {
					modelSetter(scope, element[0].files[0]);
				});
			});
		}
	};
}]);

angular.module('DHuS-webclient').controller('UploadCtrl', function ($q, $scope, AdminUploadService, AdminCollectionManager) {
	$scope.setIfSelectedFile = function () {
		$scope.isSelectedFile = (document.querySelector('#upload-file-info').innerText != "No file choosen") ? true : false;
	};

	$scope.Initdivs = function () {
		$scope.scanninginfo = "";
		$scope.urltoscan = "";
		$scope.username = "";
		$scope.password = "";
		$scope.pattern = "";
		$scope.collections = [];
		$scope.x_state = -1;
		$scope.toggle = false;
		$scope.isSelectedFile = false;

		$scope.isCron = false;
		$scope.cronValue = undefined;
		$scope.isSourceRemove = false;
		$scope.isFtp = false;
	};

	//GET-ALL
	$scope.getFileScanners = function () {
		AdminUploadService.getFileScanners()
			.then(function (response) {
				$scope.names = [];
				if (response.data.value)
					$scope.names = response.data.value;
				$scope.updateList();
			});
	};

	$scope.Initdivs();
	$scope.getFileScanners();

	//Utility Function to Generate model
	$scope.generateOdataModel = function (isNew) {
		var model = {
			"@odata.type": "",
			"Url": $scope.urltoscan,
			"Pattern": $scope.pattern,
			"SourceRemove": $scope.isSourceRemove,
			"Cron": {
				"Active": $scope.isCron				
			}
		};
		model['@odata.type'] = ($scope.isFtp) ? "#OData.DHuS.FtpScanner" : "#OData.DHuS.FileScanner";
		model.Username = ($scope.isFtp) ? $scope.username : undefined;
		model.Password = ($scope.isFtp) ? $scope.password : undefined;
		if ($scope.cronValue) 
			model.Cron.Schedule = $scope.cronValue
		return model;
	};

	//Utility Function to Generate Collections
	$scope.generateCollectionsModel = function () {
		var model = [];
		var idCollections = AdminCollectionManager.getSelectedCollectionsIds();
		for (var i = 0; i < idCollections.length; i++) {
			model.push({ "@odata.id": "Collections('" + idCollections[i] + "')" });
		}
		return model;
	};

	//Updatelist
	$scope.updateList = function (updated) {
		for (var i = 0; i < $scope.names.length; i++) {
			if (updated) {
				if (i == $scope.x_state)
					$scope.names[i].toggle = true;
				else
					$scope.names[i].toggle = false;
				$scope.names[i].toggleHover = false;

			} else {
				$scope.names[i].toggle = false;
				$scope.names[i].toggleHover = false;
				$scope.x_state = -1;
			}
			if ($scope.names[i].Cron.Active === true) {
				$scope.names[i].styleColor = "color: blue;";
			} else {
				$scope.names[i].styleColor = "color: darkgray;";
				$scope.names[i].styleColor = "color: darkgray;";
			}
		}

		//CHECK STATUS FOR v2
		for (var i = 0; i < $scope.names.length; i++) {
			//just why not a switch
			var stat = $scope.names[i].ScannerStatus.Status;
			if (stat == 'ok') {
				$scope.names[i].classicon = 'glyphicon glyphicon-ok';
			} else if (stat == 'error') {
				$scope.names[i].classicon = 'glyphicon glyphicon-remove';
			} else if (stat == 'added') {
				$scope.names[i].classicon = 'glyphicon glyphicon-question-sign';
			} else if (stat == 'running') {
				$scope.names[i].classicon = 'glyphicon glyphicon-upload';
			} else {
				$scope.names[i].classicon = 'glyphicon glyphicon-question-sign';
			}
		}
		$scope.Initdivs();
	};

	$scope.resetCheckOnField = function () {
		$('#checkUrl').css('display', 'none');
	};

	$scope.checkUrl = function (url) {
		var check = true;
		if (!url || url.trim() === "") {
			$('#checkUrl').css('display', 'inline-block');
			check = false;
		}
		else {
			$('#checkUrl').css('display', 'none');
		}
		return check;
	};

	//CREATE
	$scope.addFileScanner = function () {
		var model = $scope.generateOdataModel(true);
		if (!$scope.checkUrl(model.Url)) return;
		$scope.getScanningInfo(model);
		var collectionModel = $scope.generateCollectionsModel();
		AdminUploadService.createFileScanner(model)
			.then(function (response) {
				if (response.status >= 200 && response.status < 300) {
					//Add collections if presents on Scanner creations
					if (collectionModel && collectionModel.length > 0) {
						var promises = [];
						for (var i = 0; i < collectionModel.length; i++) {
							promises.push(AdminUploadService.addCollectionsToFS(response.data.Id, collectionModel[i]));
						}
						$q.all(promises)
							.then(function () {
								AdminUploadService.getFileScanners()
									.then(function (response) {
										$scope.names = [];
										if (response && response.data && response.data.value)
											$scope.names = response.data.value;
										$scope.updateList();
										ToastManager.success("file scanner added");
									});
							}, function () {
								ToastManager.error("file scanner added, but error occurred associating the collection to the file scanner.");
							});
					} else {
						AdminUploadService.getFileScanners()
							.then(function (response) {
								$scope.names = [];
								if (response && response.data && response.data.value)
									$scope.names = response.data.value;
								$scope.updateList();
								ToastManager.success("file scanner added");
							});
					}
				} else {
					ToastManager.error("error in add file scanner");
				}
			}, function (data) {
				ToastManager.error("error in add file scanner");
			});
	};

	//UPDATE
	$scope.saveFileScanner = function () {
		//Get the Scanner
		var collectionModel = $scope.generateCollectionsModel();
		var z = $scope.names[$scope.x_state].Id;

		AdminUploadService.getOneFileScanner($scope.names[$scope.x_state].Id)
			.then(function (response) {
				var resData = response.data;

				//Updatable values 
				resData.Pattern = $scope.pattern;
				resData.Url = $scope.urltoscan;
				resData.SourceRemove = $scope.isSourceRemove;
				resData.Cron.Active = $scope.isCron;//this way?
				resData.Cron.Schedule = $scope.cronValue;

				AdminUploadService.updateFileScanner(resData)
					.then(function (response) {
						if (response.status >= 200 && response.status < 300) {
							//Update collections on Scanner
							if ((collectionModel && collectionModel.length > 0) || $scope.collections.length > 0) {
								var promises = [];
								for (var j = 0; j < $scope.collections.length; j++) {
									promises.push(AdminUploadService.removeCollectionsToFS(z, $scope.collections[j]));
								}
								for (var i = 0; i < collectionModel.length; i++) {
									promises.push(AdminUploadService.addCollectionsToFS(z, collectionModel[i]));
								}
								$q.all(promises).then(function () {
									AdminUploadService.getFileScanners()
										.then(function (response) {
											$scope.names = [];
											if (response.data.value)
												$scope.names = response.data.value;
											$scope.updateList();
											ToastManager.success("Scanner Updated");
										});

								}, function () {
									ToastManager.error("file scanner updated, but error occurred associating the collection to the file scanner.");
								});
							} else {
								AdminUploadService.getFileScanners()
									.then(function (response) {
										$scope.names = [];
										if (response.data.value)
											$scope.names = response.data.value;
										$scope.updateList();
										ToastManager.success("Scanner Updated");
									});
							}

						} else {
							ToastManager.error("file scanner update error");
						}
					}, function () {
						ToastManager.error("file scanner update error");
					});
			}, function (data) {
				ToastManager.error("file scanner update error");
			});		
	};

	//REFRESH ALL
	$scope.refreshAllFilescanners = function () {
		$scope.isCron = false;
		$scope.cronValue = undefined;
		$scope.isSourceRemove = false;
		$scope.isFtp = false;

		$scope.scanninginfo = "";
		$scope.urltoscan = "";
		$scope.username = "";
		$scope.password = "";
		$scope.pattern = "";
		$scope.getFileScanners();
		$scope.toggle = false;
		$scope.collections = [];
		$scope.resetCheckOnField();
	};

	$scope.getFSCollections = function (model) {
		var fsCollections = [];
		for (var i = 0; i < model.length; i++) {
			fsCollections.push(model[i].Name);
		}
		return fsCollections;
	};

	//Triggered when clicking on a row item
	$scope.getScanningInfo = function (x) {
		$scope.toggle = false;
		$scope.resetCheckOnField();
		for (var i = 0; i < $scope.names.length; i++) {
			if ($scope.names[i] == x) {
				if ($scope.x_state != i && $scope.x_state != -1) {
					$scope.names[$scope.x_state].toggle = false;
				}
				if ($scope.names[i].toggle) {
					$scope.scanninginfo = "";
					$scope.collections = [];
					$scope.urltoscan = "";
					$scope.username = "";
					$scope.password = "";
					$scope.pattern = "";
					$scope.names[i].toggle = false;
					$scope.isCron = false;
					$scope.cronValue = undefined;
					$scope.isSourceRemove = false;
					$scope.isFtp = false;
				} else {
					(x['@odata.type'] === "#OData.DHuS.FtpScanner") ? $scope.isFtp = true : $scope.isFtp = false;
					var con = "";
					var arr = x.ScannerStatus.StatusMessages;
					arr.forEach(function (element) {
						con += element + "\n";
					});
					$scope.scanninginfo = con;

					// $scope.scanninginfo = JSON.stringify(x.ScannerStatus.StatusMessages).replace(',', '\n');
					$scope.collections = (x.Collections) ? $scope.getFSCollections(x.Collections) : [];
					$scope.urltoscan = x.Url;
					$scope.username = x.Username;
					$scope.password = "";
					$scope.pattern = x.Pattern;
					$scope.names[i].toggle = true;
					$scope.isCron = x.Cron.Active;
					$scope.cronValue = x.Cron.Schedule;
					$scope.isSourceRemove = x.SourceRemove;
				}
				if ($scope.names[i].toggle) {
					$scope.x_state = i;
				} else {
					$scope.x_state = -1;
				}
			}
			$scope.toggle = $scope.toggle || $scope.names[i].toggle;
		}
	};

	$scope.setIdFileScannerHovered = function (x) {
		for (var i = 0; i < $scope.names.length; i++) {
			if ($scope.names[i] == x) {
				if ($scope.x_state == -1) {
					$scope.names[i].toggleHover = true;
				}
			} else {
				if ($scope.x_state == -1) {
					$scope.names[i].toggleHover = false;
				}
			}
		}
	};

	$scope.resetIdFileScannerHovered = function () {
		for (var i = 0; i < $scope.names.length; i++) {
			$scope.names[i].toggleHover = false;
		}
	};

	//PLAY File Scanner
	$scope.playFileScanner = function (x) {
		$scope.getScanningInfo(x);
		AdminUploadService.startFileScanner(x.Id)
			.then(function (response) {
				if (response.status >= 200 && response.status < 300) {
					AdminUploadService.getFileScanners()
						.then(function (response) {
							$scope.names = [];
							if (response.data)
								$scope.names = response.data.value;
							$scope.updateList();
							ToastManager.success("file scanner played");
						});
				} else {
					ToastManager.error("error in play file scanner");
				}
			},
				function (data) {
					ToastManager.error("error in play file scanner");
				}
			);
	};

	//STOP File Scanner
	$scope.stopFileScanner = function (x) {
		$scope.getScanningInfo(x);
		AdminUploadService.stopFileScanner(x.Id)
			.then(function (response) {
				if (response.status >= 200 && response.status < 300) {
					AdminUploadService.getFileScanners()
						.then(function (response) {
							$scope.names = [];
							if (response.data)
								$scope.names = response.data.value;
							$scope.updateList();
							ToastManager.success("file scanner stopped");
						});
				} else {
					ToastManager.error("error in stop file scanner");
				}
			}, function (data) {
				ToastManager.error("error in stop file scanner");
			});
	};

	//DELETE
	$scope.removeFileScanner = function (x) {
		$scope.getScanningInfo(x);
		AdminUploadService.removeFileScanner(x.Id)
			.then(function (response) {
				if (response.status >= 200 && response.status < 300) {
					AdminUploadService.getFileScanners()
						.then(function (response) {
							$scope.names = [];
							if (response.data) {
								$scope.names = response.data.value;
							}
							$scope.updateList();
							ToastManager.success("file scanner removed");
						});
				} else {
					ToastManager.error("error in remove file scanner");
				}
			},
				function (data) {
					ToastManager.error("error in remove file scanner");
				}
			);
	};

	//SINGLE FILE UPLOAD
	$scope.uploadProduct = function () {
		if ($scope.isSelectedFile === false) {
			ToastManager.error("Please select a file to upload");
			return;
		}
		var file = $scope.fileToUpload;
		var selected = AdminCollectionManager.getSelectedCollectionsUUID();
		AdminUploadService.uploadProduct(file, selected)
			.then(function (response) {
				if (response.status == 200 || response.status == 201)
					AlertManager.success('Product Upload Succeeded', response.data);
				else
					AlertManager.error('Product Upload Error', response.data.replace('<style>', '').replace('</style>', ''));
			}, function (response) {
				AlertManager.error('Product Upload Error', response.data.replace('<style>', '').replace('</style>', ''));
			});
	};

	$scope.cleanFields = function() {
		if ($scope.isFtp) {
			$scope.username = undefined
			$scope.password = undefined
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//REMOVE SCHEDULE scanner
	$scope.scheduleFileScanner = function (x) {
		$scope.getScanningInfo(x);
		AdminUploadService.getOneFileScanner(x.Id)
			.then(function (response) {
				var resData = response.data;
				//Updatable schedule values 
				resData.Cron.Active = !resData.Cron.Active;//this way?
				AdminUploadService.updateFileScanner(resData)
					.then(function (response) {
						if (response.status >= 200 && response.status < 300) {
							AdminUploadService.getFileScanners()
								.then(function (response) {
									$scope.names = [];
									if (response.data.value)
										$scope.names = response.data.value;
									$scope.updateList();
									ToastManager.success("Scanner Schedule Updated");
								});
						} else {
							ToastManager.error("file scanner update error");
						}
					}, function () {
						ToastManager.error("file scanner update error");
					});
			}, function (data) {
				ToastManager.error("file scanner update error");
			});		
	};

});