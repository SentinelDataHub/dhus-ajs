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
'use strict';

/**
 * @ngdoc function
 * @name DHuS-webclient.controller:AboutCtrl
 * @description
 * # AboutCtrlf
 * Controller of the DHuS-webclient
 */
angular.module('DHuS-webclient')
    .directive('fileModel', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }]);
angular.module('DHuS-webclient')
    .controller('UploadCtrl', function($q, $scope, AdminUploadService, AdminCollectionManager) {

        $scope.setIfSelectedFile = function() {
            var namefile = document.querySelector('#upload-file-info').innerText;
            if (namefile != "No file choosen") {
                $scope.isSelectedFile = true;
            } else {
                $scope.isSelectedFile = false;
            }
        };


        $scope.getFileScanners = function() {

            AdminUploadService.getFileScanners()
                .then(function(response) {
                    $scope.names = [];
                    if (response && response.data && response.data.d)
                        $scope.names = response.data.d.results;
                    $scope.updateList();
                });
        };

        $scope.getFileScanners();
        $scope.scanninginfo = "";
        $scope.urltoscan = "";
        $scope.username = "";
        $scope.password = "";
        $scope.pattern = "";
        $scope.collections = [];
        $scope.x_state = -1;
        $scope.toggle = false;
        $scope.isSelectedFile = false;

        $scope.generateModel = function(isNew) {
            var model = {};
            model.Url = $scope.urltoscan;
            if ($scope.username && $scope.username != '')
                model.Username = $scope.username;
            if ($scope.password && $scope.password != '')
                model.Password = $scope.password;
            if ($scope.pattern && $scope.pattern != '')
                model.Pattern = $scope.pattern;
            if (isNew) {
                model.Active = false;
                model.Status = "added";
                model.StatusMessage = "Added on " + moment().format("dddd DD MMMM YYYY - HH:mm:ss");
            } else {
                model.Status = "added";
                model.StatusMessage = "Updated on " + moment().format("dddd DD MMMM YYYY - HH:mm:ss");
                model.Id = $scope.names[$scope.x_state].Id
            }
            return model;
        };

        $scope.generateCollectionsModel = function() {
            var model = [];
            var idCollections = AdminCollectionManager.getSelectedCollectionsIds();
            for (var i = 0; i < idCollections.length; i++) {
                model.push({ "uri": "odata/v1/Collections('" + idCollections[i] + "')" });
            }
            return model;
        };

        $scope.updateList = function(updated) {
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

                if ($scope.names[i].Active == true) {
                    $scope.names[i].styleColor = "color: blue;";
                } else {
                    $scope.names[i].styleColor = "color: darkgray;";
                }
            }
            for (var i = 0; i < $scope.names.length; i++) {
                if ($scope.names[i].Status == 'ok') {
                    $scope.names[i].classicon = 'glyphicon glyphicon-ok';
                } else if ($scope.names[i].Status == 'error') {
                    $scope.names[i].classicon = 'glyphicon glyphicon-remove';
                } else if ($scope.names[i].Status == 'added') {
                    $scope.names[i].classicon = 'glyphicon glyphicon-question-sign';
                } else if ($scope.names[i].Status == 'running') {
                    $scope.names[i].classicon = 'glyphicon glyphicon-upload';
                } else {
                    $scope.names[i].classicon = 'glyphicon glyphicon-question-sign';
                }
            }
        }

        $scope.resetCheckOnField = function(){
            $('#checkUrl').css('display','none');
        }

        $scope.checkUrl = function(url){

          var check = true;
          if(!url || url.trim() == "")
          {
            $('#checkUrl').css('display','inline-block');
            check = false;
          }
          else
          {
            $('#checkUrl').css('display','none');
          }
          return check;

        };

        $scope.addFileScanner = function() {
            var model = $scope.generateModel(true);
            if(!$scope.checkUrl(model.Url)) return;
            $scope.getScanningInfo(model);
            var collectionModel = $scope.generateCollectionsModel();
            AdminUploadService.createFileScanner(model)
                .then(function(response) {
                        var responseStatus = parseInt(response.status);
                        if (responseStatus >= 200 && responseStatus < 300) {
                            if (collectionModel && collectionModel.length > 0) {

                                var promises = [];
                                for (var i = 0; i < collectionModel.length; i++) {
                                    promises.push(AdminUploadService.addCollectionsToFS(response.data.d.Id, collectionModel[i]));
                                }
                                $q.all(promises).then(function() {

                                    AdminUploadService.getFileScanners()
                                        .then(function(response) {
                                            $scope.names = [];
                                            if (response && response.data && response.data.d)
                                                $scope.names = response.data.d.results;
                                            $scope.updateList();
                                            ToastManager.success("file scanner added");
                                        });

                                }, function() {
                                    ToastManager.error("file scanner added, but error occurred associating the collection to the file scanner.");
                                });
                            } else {
                                AdminUploadService.getFileScanners()
                                    .then(function(response) {
                                        $scope.names = [];
                                        if (response && response.data && response.data.d)
                                            $scope.names = response.data.d.results;
                                        $scope.updateList();
                                        ToastManager.success("file scanner added");
                                    });
                            }

                        } else {
                            ToastManager.error("error in add file scanner");
                        }
                    },
                    function(data) {
                        ToastManager.error("error in add file scanner");
                    }
                );
        };

        $scope.saveFileScanner = function() {
            var collectionModel = $scope.generateCollectionsModel();
            var model = $scope.generateModel();
            if(!$scope.checkUrl(model.Url)) return;
            AdminUploadService.updateFileScanner(model)
                .then(function(response) {
                        var responseStatus = parseInt(response.status);
                        if (responseStatus >= 200 && responseStatus < 300) {
                            if ((collectionModel && collectionModel.length > 0) || $scope.collections.length > 0) {

                                var promises = [];
                                for (var j = 0; j < $scope.collections.length; j++) {
                                    promises.push(AdminUploadService.removeCollectionsToFS(model.Id, $scope.collections[j]));
                                }
                                for (var i = 0; i < collectionModel.length; i++) {
                                    promises.push(AdminUploadService.addCollectionsToFS(model.Id, collectionModel[i]));
                                }
                                $q.all(promises).then(function() {

                                    AdminUploadService.getFileScanners()
                                        .then(function(response) {
                                            $scope.names = [];
                                            if (response && response.data && response.data.d)
                                                $scope.names = response.data.d.results;
                                            $scope.updateList(true);
                                            ToastManager.success("file scanner updated");
                                        });

                                }, function() {
                                    ToastManager.error("file scanner updated, but error occurred associating the collection to the file scanner.");
                                });
                            } else {
                                AdminUploadService.getFileScanners()
                                    .then(function(response) {
                                        $scope.names = [];
                                        if (response && response.data && response.data.d)
                                            $scope.names = response.data.d.results;
                                        $scope.updateList(true);
                                        ToastManager.success("file scanner updated");
                                    });
                            }
                        } else {
                            //console.log("fs response", response);
                            if(response.status == 409) {
                               AlertManager.error("Error updating file scanner", response.data.error.message.value);

                            } else {
                                ToastManager.error("error in update file scanner");
                            }
                            
                        }
                    },
                    function(data) {
                        ToastManager.error("error in update file scanner");
                    }
                );
        };

        $scope.refreshAllFilescanners = function() {
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

        $scope.getFSCollections = function(model) {
            var fsCollections = [];
            for (var i = 0; i < model.length; i++) {
                fsCollections.push(model[i].Name);
            }
            return fsCollections;
        };

        $scope.getScanningInfo = function(x) {
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
                    } else {
                        $scope.scanninginfo = x.StatusMessage;
                        $scope.collections = (x.Collections && x.Collections.results) ? $scope.getFSCollections(x.Collections.results) : [];
                        $scope.urltoscan = x.Url;
                        $scope.username = x.Username;
                        $scope.password = "";
                        $scope.pattern = x.Pattern;
                        $scope.names[i].toggle = true;
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

        $scope.setIdFileScannerHovered = function(x) {
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

        $scope.resetIdFileScannerHovered = function() {
            for (var i = 0; i < $scope.names.length; i++) {
                $scope.names[i].toggleHover = false;
            }
        };

        $scope.playFileScanner = function(x) {
            $scope.getScanningInfo(x);
            AdminUploadService.startFileScanner(x.Id)
                .then(function(response) {
                        var responseStatus = parseInt(response.status);
                        if (responseStatus >= 200 && responseStatus < 300) {
                            AdminUploadService.getFileScanners()
                                .then(function(response) {
                                    $scope.names = [];
                                    if (response && response.data && response.data.d)
                                        $scope.names = response.data.d.results;
                                    $scope.updateList();
                                    ToastManager.success("file scanner played");
                                });
                        } else {
                            ToastManager.error("error in play file scanner");
                        }
                    },
                    function(data) {
                        ToastManager.error("error in play file scanner");
                    }
                );
        };


        $scope.stopFileScanner = function(x) {
            $scope.getScanningInfo(x);
            AdminUploadService.stopFileScanner(x.Id)
                .then(function(response) {
                        var responseStatus = parseInt(response.status);
                        if (responseStatus >= 200 && responseStatus < 300) {
                            AdminUploadService.getFileScanners()
                                .then(function(response) {
                                    $scope.names = [];
                                    if (response && response.data && response.data.d)
                                        $scope.names = response.data.d.results;
                                    $scope.updateList();
                                    ToastManager.success("file scanner stopped");
                                });
                        } else {
                            ToastManager.error("error in stop file scanner");
                        }
                    },
                    function(data) {
                        ToastManager.error("error in stop file scanner");
                    }
                );
        };


        $scope.scheduleFileScanner = function(x) {
            $scope.getScanningInfo(x);
            var status = !x.Active;
            if (status) {
                x.styleColor = "color: blue;";
            } else {
                x.styleColor = "color: darkgray;";
            }
            AdminUploadService.activateDeactivateFileScanner(x.Id, status)
                .then(function(response) {
                        var responseStatus = parseInt(response.status);
                        if (responseStatus >= 200 && responseStatus < 300) {
                            AdminUploadService.getFileScanners()
                                .then(function(response) {
                                    $scope.names = [];
                                    if (response && response.data && response.data.d)
                                        $scope.names = response.data.d.results;
                                    $scope.updateList();
                                    if (status) {
                                        ToastManager.success("file scanner is activated");
                                    } else {
                                        ToastManager.success("file scanner is disactivated");
                                    }
                                });
                        } else {
                            if (status) {
                                ToastManager.success("error in activation file scanner");
                            } else {
                                ToastManager.success("error in disactivation file scanner");
                            }
                        }
                    },
                    function(data) {
                        if (status) {
                            ToastManager.success("error in activation file scanner");
                        } else {
                            ToastManager.success("error in disactivation file scanner");
                        }
                    }
                );
        };

        $scope.removeFileScanner = function(x) {
            $scope.getScanningInfo(x);
            $scope.scanninginfo = "";
            $scope.urltoscan = "";
            $scope.username = "";
            $scope.password = "";
            $scope.pattern = "";
            AdminUploadService.removeFileScanner(x.Id)
                .then(function(response) {
                        var responseStatus = parseInt(response.status);
                        if (responseStatus >= 200 && responseStatus < 300) {
                            AdminUploadService.getFileScanners()
                                .then(function(response) {
                                    $scope.names = [];
                                    if (response && response.data && response.data.d)
                                        $scope.names = response.data.d.results;
                                    $scope.updateList();
                                    ToastManager.success("file scanner removed");
                                    $scope.scanninginfo = "";
                                    $scope.urltoscan = "";
                                    $scope.username = "";
                                    $scope.password = "";
                                    $scope.pattern = "";
                                    $scope.collections = [];
                                    $scope.x_state = -1;
                                    $scope.toggle = false;
                                    $scope.isSelectedFile = false;
                                });
                        } else {
                            ToastManager.error("error in remove file scanner");
                        }
                    },
                    function(data) {
                        ToastManager.error("error in remove file scanner");
                    }
                );
        };


        $scope.uploadProduct = function() {
            if ($scope.isSelectedFile == false) return;
            var file = $scope.fileToUpload;
            //console.log('file is ' );
            // console.dir(file);
            var uploadUrl = ApplicationConfig.baseUrl + "/api/upload";
            var selected = AdminCollectionManager.getSelectedCollectionsIds();
            //console.log('get selected ids!!!!  ',selected);
            AdminUploadService.uploadProduct(file, selected)
                .then(function(response) {
                    //console.log(response) ;
                    var d = $('<div>').html(response.data);

                    if (response.status == 200 || response.status == 201)
                        AlertManager.success('Product Upload Succeeded', response.data);
                    else
                        AlertManager.error('Product Upload Error', response.data.replace('<style>', '').replace('</style>', ''));


                }, function(response) {
                    AlertManager.error('Product Upload Error', response.data.replace('<style>', '').replace('</style>', ''));

                });
        };


    });