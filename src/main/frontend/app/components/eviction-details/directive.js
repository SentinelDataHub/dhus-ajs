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
angular.module('DHuS-webclient').directive('evictionDetails', function ($location, $document, $window, ODataEvictionService, EvictionModel) {
	return {
		restrict: 'AE',
		replace: true,
		templateUrl: 'components/eviction-details/view.html',
		scope: {
			text: "="
		},
		compile: function (tElem, tAttrs) {
			return {
				pre: function (scope, iElem, iAttrs) { },
				post: function (scope, iElem, iAttrs) {
					scope.eviction = {};
					scope.checkFields = true;
					scope.isNew = false;
					scope.periods = ["DAYS"];
					EvictionDetailsManager.setEvictionDetails(function (name, isNew) { scope.getEvictionDetails(name, isNew) });

					function initEviction(name, isNew) {
						if (ApplicationService.settings && ApplicationService.settings.keep_period_unit) {
							scope.periods = ApplicationService.settings.keep_period_unit;
						}

						if (isNew) {
							scope.eviction = {};
							scope.eviction.Cron = {};
							scope.resetFields();
						} else {
							loadEvictionDetails(name);
						}
					}

					function loadEvictionDetails(name) {
						ODataEvictionService.readEviction(name)
							.then(function (result) {
								if (result.status == 200) {
									if (result.data) {
										scope.eviction.Name = result.data.Name;
										scope.eviction.MaxEvictedProducts = result.data.MaxEvictedProducts;
										scope.eviction.KeepPeriod = result.data.KeepPeriod;
										scope.eviction.KeepPeriodUnit = result.data.KeepPeriodUnit;
										scope.eviction.Filter = result.data.Filter;
										scope.eviction.OrderBy = result.data.OrderBy;
										scope.eviction.TargetCollection = result.data.TargetCollection;
										scope.eviction.SoftEviction = result.data.SoftEviction;
										scope.eviction.Status = result.data.Status;
										scope.eviction.Cron = {};
										scope.eviction.Cron.Schedule = result.data.Cron.Schedule;
										scope.eviction.Cron.Active = result.data.Cron.Active;
										scope.evictionOld = angular.copy(scope.eviction);
									}
								} else {
									ToastManager.error("error reading eviction details");
								}
							}, function (result) {
								ToastManager.error("error reading eviction details");
							});
					}

					scope.getEvictionDetails = function (name, isNew) {
						console.log("getting eviction details...");
						
						scope.isNew = isNew;
						initEviction(name, isNew);
						if (!$('#evtDetails').hasClass('in'))
							$('#evtDetails').modal('show');
					};

					$('#evtDetails').on('shown.bs.modal', function (e) {
						$('#evtcheckName').css('display', 'none');
						$('#evtcheckKeepPeriod').css('display', 'none');
						$('#evtcheckMaxEvictedProducts').css('display', 'none');

						// if (ApplicationService.settings && ApplicationService.settings.keep_period_unit){
						// 	scope.periods = ApplicationService.settings.keep_period_unit;
						// 	console.log('scope.periods',scope.periods);
						// }

						ODataEvictionService.collections().then(function (collections) {
							var collectionsName = [];
							for (var i = 0; i < collections.data.d.results.length; i++) {
								collectionsName.push(collections.data.d.results[i].Name);
							}
							scope.collectionsName = collectionsName;
						});
					});

					scope.checkName = function () {
						var check = true;
						if (!scope.eviction.Name || scope.eviction.Name.trim() == "") {
							$('#evtcheckName').css('display', 'inline-block');
							check = false;
						} else {
							$('#evtcheckName').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkKeepPeriod = function () {
						var check = true;
						if (!scope.eviction.KeepPeriod || scope.eviction.KeepPeriod == 0) {
							$('#evtcheckKeepPeriod').css('display', 'inline-block');
							check = false;
						} else {
							$('#evtcheckKeepPeriod').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;

					};
					scope.checkMaxEvictedProducts = function () {
						var check = true;
						if (!scope.eviction.MaxEvictedProducts || scope.eviction.MaxEvictedProducts == 0) {
							$('#evtcheckMaxEvictedProducts').css('display', 'inline-block');
							check = false;
						} else {
							$('#evtcheckMaxEvictedProducts').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkSchedule = function () {
						var check = true;
						if (scope.eviction.Cron && scope.eviction.Cron.Active && (!scope.eviction.Cron.Schedule || scope.eviction.Cron.Schedule.trim() == "")) {
							$('#evtcheckCron').css('display', 'inline-block');
							check = false;
						} else {
							$('#evtcheckCron').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;

					};

					scope.checkFilter = function () {
						if (!scope.eviction.Filter || scope.eviction.Filter.trim() == "") {
							scope.eviction.Filter = null;
						}
					};

					scope.checkOrderBy = function () {
						if (!scope.eviction.OrderBy || scope.eviction.OrderBy.trim() == "") {
							scope.eviction.OrderBy = null;
						}
					};

					scope.checkTargetCollection = function () {
						if (!scope.eviction.TargetCollection || scope.eviction.TargetCollection.trim() == "") {
							scope.eviction.TargetCollection = null;
						}
					};

					scope.checkEvictionFields = function () {
						scope.checkFields = true;
						scope.checkName();
						scope.checkKeepPeriod();
						scope.checkMaxEvictedProducts();
						scope.checkSchedule();
						scope.checkFilter();
						scope.checkOrderBy();
						scope.checkTargetCollection();

					};

					scope.save = function () {
						scope.checkEvictionFields();
						if (scope.checkFields) {
							if (scope.isNew) {
								scope.createEviction();
							} else {
								scope.updateEviction();
							}
						}
					};

					scope.createEviction = function () {
						var msg = "eviction creation failed";
						ODataEvictionService.createEviction(scope.eviction)
							.then(function (result) {
								if (result.status == 200 || result.status == 201 || result.status == 202 || result.status == 203 || result.status == 204) {
									ODataEvictionService.getEvictionList()
										.then(function (response) {
											var modelFromServer = response.data.value;
											EvictionModel.createModel(modelFromServer, modelFromServer.length);
											ToastManager.success("eviction created");
											scope.close();
										});
								} else {
									(result.data && result.data.error && result.data.error.message) ? msg = msg + ". Reason: " + result.data.error.message : msg
									ToastManager.error(msg);
								}

							}, function (result) {
								(result.data && result.data.error && result.data.error.message) ? msg = msg + ". Reason: " + result.data.error.message : msg
								ToastManager.error(msg);
							});
					};

					scope.updateEviction = function () {
						var msg = "eviction update failed";
						ODataEvictionService.updateEviction(scope.eviction.Name, scope.eviction)
							.then(function (result) {
								if (result.status == 200 || result.status == 201 || result.status == 202 || result.status == 203 || result.status == 204) {
									ODataEvictionService.getEvictionList()
										.then(function (response) {
											
											var modelFromServer = response.data.value;
											console.log("modelFromServer:", modelFromServer);
											


											EvictionModel.createModel(modelFromServer, modelFromServer.length);
											
											
											
											ToastManager.success("eviction updated");
											scope.close();
										});
								} else {
									(result.data && result.data.error && result.data.error.message) ? msg = msg + ". Reason: " + result.data.error.message : msg
									ToastManager.error(msg);
								}

							}, function (result) {
								(result.data && result.data.error && result.data.error.message) ? msg = msg + ". Reason: " + result.data.error.message : msg
								ToastManager.error(msg);
							});
					};

					scope.resetFields = function () {
						scope.eviction.Name = '';
						scope.eviction.MaxEvictedProducts = '';
						scope.eviction.KeepPeriod = '';
						scope.eviction.KeepPeriodUnit = 'DAYS';
						scope.eviction.Filter = null;
						scope.eviction.OrderBy = null;
						scope.eviction.TargetCollection = null;
						scope.eviction.SoftEviction = false;
						scope.eviction.Cron.Active = false;
						scope.eviction.Cron.Schedule = '';
						scope.eviction.Status = 'STOPPED';
					};

					scope.close = function () {
						$('#evtDetails').modal('hide');
					};
				}
			};
		}
	};
});
