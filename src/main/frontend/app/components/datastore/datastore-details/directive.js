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
angular.module('DHuS-webclient').directive('datastoreDetails', function (ODataDatastoreService, DatastoreModel, ODataEvictionService, ConfigurationService) {
	return {
		restrict: 'AE',
		replace: true,
		templateUrl: 'components/datastore/datastore-details/view.html',
		scope: {
			text: "="
		},
		compile: function (tElem, tAttrs) {
			return {
				pre: function (scope, iElem, iAttrs) {
					scope.openstack_ds = ApplicationService.settings.openstack_ds;
					scope.hfs_ds = ApplicationService.settings.hfs_ds;
					scope.gmp_ds = ApplicationService.settings.gmp_ds;
					scope.remote_ds = ApplicationService.settings.remote_ds;

					if (!ConfigurationService.isLoaded()) {
						ConfigurationService.getConfiguration().then(function (data) {
							if (data) {
								scope.openstack_ds = ApplicationService.settings.openstack_ds;
								scope.hfs_ds = ApplicationService.settings.hfs_ds;
								scope.gmp_ds = ApplicationService.settings.gmp_ds;
								scope.remote_ds = ApplicationService.settings.remote_ds;
							}
						},
							function (error) { });
					}
					else {
						baseUrl = ApplicationConfig.baseUrl;
					}
				},
				post: function (scope, iElem, iAttrs) {
					scope.datastore = {};

					//GMP FIELDS
					scope.datastore.Quotas = {};
					scope.datastore.MySQLConnectionInfo = {};
					scope.datastore.Configuration = {};
					scope.checkFields = true;
					scope.isNew = false;

					DatastoreDetailsManager.setDatastoreDetails(function (name, isNew) {
						scope.getDatastoreDetails(name, isNew);
					});

					//Reset Divs on changing type
					scope.$watch(function () {
						return scope.datastore.Type;
					}, function (newvalue) {
						if (!scope.isNew) return;
						scope.resetFields();
					});

					function initDatastore(name, isNew) {
						//Datastore Appconfig.json configurations
						var ASD = ApplicationService.settings.datastores;
						scope.openstack_ds = (ASD === undefined || ASD.openstack_ds === undefined) ? true : ASD.openstack_ds;
						scope.hfs_ds = (ASD === undefined || ASD.hfs_ds === undefined) ? true : ASD.hfs_ds;
						scope.gmp_ds = (ASD === undefined || ASD.gmp_ds === undefined) ? true : ASD.gmp_ds;
						scope.remote_ds = (ASD === undefined || ASD.remote_ds === undefined) ? true : ASD.remote_ds;

						ODataDatastoreService.evictions().
									then(function (evictions) {
										var evictionsName = [];
										// console.log("evictions are", evictions.data.value);
										// evictionsName.push('');
										for (var i = 0; i < evictions.data.value.length; i++) {
											// console.log
											evictionsName.push(evictions.data.value[i].Name);
										}
										scope.evictionsName = evictionsName;
										// console.log("scope.evictionsName:", scope.evictionsName);
									});

						if (isNew) {
							scope.datastore = {};
							// scope.datastore.Type = "Open Stack Data Store"; //Default Datastore Type on Creation
							scope.resetFields();
						} else {
							loadDatastoreDetails(name);
						}
					}

					function loadDatastoreDetails(name) {

						ODataDatastoreService.evictions()
							.then(function (response) {
								// console.log("response evictions is", response.data);
							}, function (result) {
								scope.datastore.Eviction = "ERROR";
								// ToastManager.error(msg + (". Reason: " + result.data.error.message || ""));
							});

						ODataEvictionService.getEvictionList()
							.then(function (response) {
								scope.datastore = {}; //reset datastore object
								scope.datastore.evictions = response.data.value;
								ODataDatastoreService.checkCurrentDataStore(name)
									.then(function (result) {
										if (result.status >= 200 && result.status <= 204) {
											var dsData = result.data;

											//COMMON FIELDS
											scope.datastore.Name = dsData.Name;
											scope.datastore.Priority = dsData.Priority;
											scope.datastore.MaximumSize = dsData.MaximumSize;
											scope.datastore.CurrentSize = dsData.CurrentSize;
											scope.datastore.AutoEviction = dsData.AutoEviction;
											scope.datastore.ReadOnly = dsData.ReadOnly;

											if (dsData.Eviction) {
												scope.datastore.Eviction = dsData.Eviction.Name;
											}
											//Datastore Type
											scope.datastore.Type = DatastoreUtils.getDatastoreTypeFromOdata(dsData['@odata.type']);

											//Populate specific fields based on different datastore mdoels
											switch (scope.datastore.Type) {
												case "Open Stack Data Store":
													scope.datastore.Provider = dsData.Provider;
													scope.datastore.Identity = dsData.Identity;
													scope.datastore.Identity = dsData.Identity;
													scope.datastore.Credential = dsData.Credential;
													scope.datastore.Url = dsData.Url;
													scope.datastore.Region = dsData.Region;
													scope.datastore.Container = dsData.Container;
													break;
												case "HFS Data Store":
													scope.datastore.Path = dsData.Path;
													scope.datastore.MaxFileDepth = dsData.MaxFileDepth;
													scope.datastore.MaxItems = dsData.MaxItems;
													break;
												case "DHuS Remote Data Store":
													scope.datastore.ServiceUrl = dsData.ServiceUrl;
													scope.datastore.Login = dsData.Login;
													scope.datastore.Password = dsData.Password;
													break;
												case "GMP Data Store":
													//TEST NEEDED!
													scope.datastore.RepoLocation = dsData.RepoLocation;
													scope.datastore.HFSLocation = dsData.HFSLocation;

													scope.datastore.MaxQueuedRequest = dsData.MaxQueuedRequest;
													scope.datastore.Quotas = {};

													scope.datastore.QuotasMaxQueryPerUser = dsData.Quotas.MaxQueryPerUser;
													scope.datastore.QuotasTimespan = dsData.Quotas.Timespan;
													scope.datastore.IsMaster = dsData.IsMaster || false;

													scope.datastore.MySQLConnectionInfo = {};
													scope.datastore.MySQLConnectionInfoDatabaseUrl = dsData.MySQLConnectionInfo.DatabaseUrl;
													scope.datastore.MySQLConnectionInfoUser = dsData.MySQLConnectionInfo.User;
													scope.datastore.MySQLConnectionInfoPassword = dsData.MySQLConnectionInfo.Password;

													scope.datastore.Configuration = {};
													scope.datastore.ConfigurationAgentId = dsData.Configuration.AgentId;
													scope.datastore.ConfigurationTargetId = dsData.Configuration.TargetId;
													break;
												default:
													console.warn("DataStore type Unknown");
													break;
											}
										} else {
											scope.datastore.Eviction = "ERROR";
										}
									}, function (result) {
										scope.datastore.Eviction = "ERROR";
										ToastManager.error(msg + (". Reason: " + result.data.error.message)); 
									});
							});
					}

					scope.getDatastoreDetails = function (name, isNew) {
						scope.isNew = isNew;
						initDatastore(name, isNew);
						if (!$('#dsDetails').hasClass('in'))
							$('#dsDetails').modal('show');
					};

					//Reset Error divs on Showing Datastore details
					$('#dsDetails').on('shown.bs.modal', function (e) {
						scope.resetErrorDivs();
					});

					//COMMON FIELDS CHECK

					//Type
					scope.checkType = function () {
						var check = true;
						if (!scope.datastore.Type || scope.datastore.Type.trim() === "") {
							$('#dscheckType').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckType').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//Name
					scope.checkName = function () {
						var check = true;
						if (!scope.datastore.Name || scope.datastore.Name.trim() === "") {
							$('#dscheckName').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckName').css('display', 'none');
						}

						//Special Character Validator for Name 
						if (/[^a-zA-Z0-9\-\_\/]/.test(scope.datastore.Name)) {
							check = false;
							ToastManager.error('Data Store Name Input is not alphanumeric');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//Priority
					scope.checkPriority = function () {
						var condition = (scope.datastore.Priority === "");
						scope.validateField(condition, '#dscheckPriority');
					};

					/*FIELD VALIDATION
					*	TODO: Use for other fields
					*/
					scope.validateField = function (condition, errDiv) {
						$(errDiv).css('display', condition ? 'inline-block' : 'none');
						scope.checkFields = scope.checkFields && condition ? false : true;
					};

					//MaximumSize
					scope.checkMaximumSize = function () {
						var check = true;
						if (scope.datastore.MaximumSize === "") {
							$('#dscheckMaximumSize').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMaximumSize').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//Currentsize	
					scope.checkCurrentSize = function () {
						var check = true;
						if (scope.datastore.CurrentSize === "") {
							$('#dscheckCurrentSize').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckCurrentSize').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//HFS VALIDATOR METHODS
					scope.checkHFSPath = function () {
						var check = true;
						if (!scope.datastore.Path || scope.datastore.Path === "") {
							$('#dscheckPath').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckPath').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkHFSMaxFileDepth = function () {
						var check = true;
						if (scope.datastore.MaxFileDepth === "") {
							$('#dscheckMaxFileDepth').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMaxFileDepth').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkHFSMaxItems = function () {
						var check = true;
						if (scope.datastore.MaxItems === "") {
							$('#dscheckMaxItems').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMaxItems').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//OPEN STACK VALIDATOR METHODS
					scope.checkOSProvider = function () {
						var condition = (!scope.datastore.Provider || scope.datastore.Provider === "");
						var divErrorId = '#dscheckProvider';
						$(divErrorId).css('display', condition ? 'inline-block' : 'none');
						scope.checkFields = scope.checkFields && condition ? false : true;
					};

					scope.checkOSIdentity = function () {
						var check = true;
						if (!scope.datastore.Identity || scope.datastore.Identity === "") {
							$('#dscheckIdentity').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckIdentity').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkOSCredential = function () {
						var check = true;
						if (!scope.datastore.Credential || scope.datastore.Credential === "") {
							$('#dscheckCredential').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckCredential').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkOSUrl = function () {
						var check = true;
						if (!scope.datastore.Url || scope.datastore.Url === "") {
							$('#dscheckUrl').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckUrl').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkOSRegion = function () {
						var check = true;
						if (!scope.datastore.Region || scope.datastore.Region === "") {
							$('#dscheckRegion').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckRegion').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkOSContainer = function () {
						var check = true;
						if (!scope.datastore.Container || scope.datastore.Container === "") {
							$('#dscheckContainer').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckContainer').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//REMOTE DATASTORE VALIDATOR METHODS
					scope.checkRMServiceUrl = function () {
						var check = true;
						if (!scope.datastore.ServiceUrl || scope.datastore.ServiceUrl === "") {
							$('#dscheckRMServiceUrl').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckRMServiceUrl').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkRMLogin = function () {
						var check = true;
						if (!scope.datastore.Login || scope.datastore.Login === "") {
							$('#dscheckRMLogin').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckRMLogin').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkRMPassword = function () {
						var check = true;
						if (!scope.datastore.Login || scope.datastore.Login === "") {
							$('#dscheckRMPassword').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckRMPassword').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//GMP VALIDATOR METHODS
					scope.checkGMPRepoLocation = function () {
						var check = true;
						if (!scope.datastore.RepoLocation || scope.datastore.RepoLocation === "") {
							$('#dscheckGMPRepoLocation').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckGMPRepoLocation').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};
 
					scope.checkGMPHFSLocation = function () {
						var check = true;
						if (!scope.datastore.HFSLocation || scope.datastore.HFSLocation === "") {
							$('#dscheckHFSLocation').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckHFSLocation').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkMaxQueuedRequest = function () {
						var check = true;
						if (!scope.datastore.MaxQueuedRequest || scope.datastore.MaxQueuedRequest === "") {
							$('#dscheckMaxQueuedRequest').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMaxQueuedRequest').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};


					//Quotas
					scope.checkGMPQuotasMaxQueryPerUser = function () {
						var check = true;
						if (!scope.datastore.QuotasMaxQueryPerUser || scope.datastore.QuotasMaxQueryPerUser === "") {
							$('#dscheckQuotasMaxQueryPerUser').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckQuotasMaxQueryPerUser').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkGMPQuotasTimespan = function () {
						var check = true;
						if (!scope.datastore.QuotasTimespan || scope.datastore.QuotasTimespan === "") {
							$('#dscheckQuotasTimespan').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckQuotasTimespan').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					// MySQLConnectionInfo
					scope.checkGMPMySQLConnectionInfoDatabaseUrl = function () {
						var check = true;
						if (!scope.datastore.MySQLConnectionInfoDatabaseUrl || scope.datastore.MySQLConnectionInfoDatabaseUrl === "") {
							$('#dscheckMySQLConnectionInfoDatabaseUrl').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMySQLConnectionInfoDatabaseUrl').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkGMPMySQLConnectionInfoUser = function () {
						var check = true;
						if (!scope.datastore.MySQLConnectionInfoUser || scope.datastore.MySQLConnectionInfoUser === "") {
							$('#dscheckMySQLConnectionInfoUser').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMySQLConnectionInfoUser').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkGMPMySQLConnectionInfoPassword = function () {
						var check = true;
						if (!scope.datastore.MySQLConnectionInfoDatabaseUrl || scope.datastore.MySQLConnectionInfoDatabaseUrl === "") {
							$('#dscheckMySQLConnectionInfoPassword').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckMySQLConnectionInfoPassword').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					//Configuration
					scope.checkGMPConfigurationAgentId = function () {
						var check = true;
						if (!scope.datastore.ConfigurationAgentId || scope.datastore.ConfigurationAgentId === "") {
							$('#dscheckConfigurationAgentId').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckConfigurationAgentId').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.checkGMPConfigurationTargetId = function () {
						var check = true;
						if (!scope.datastore.ConfigurationTargetId || scope.datastore.ConfigurationTargetId === "") {
							$('#dscheckConfigurationTargetId').css('display', 'inline-block');
							check = false;
						} else {
							$('#dscheckConfigurationTargetId').css('display', 'none');
						}
						scope.checkFields = scope.checkFields && check;
					};

					scope.validator = function () {
						scope.checkFields = true;

						//Common fields Validator
						scope.checkType();
						scope.checkName();
						scope.checkPriority();

						if (scope.datastore.Type !== "DHuS Remote Data Store") {
							scope.checkMaximumSize();
							scope.checkCurrentSize();
						}

						//Specific Fields Validator. No checks on checkboxes
						switch (scope.datastore.Type) {
							case "Open Stack Data Store":
								scope.checkOSProvider();
								scope.checkOSIdentity();
								scope.checkOSCredential();
								scope.checkOSUrl();
								scope.checkOSRegion();
								scope.checkOSContainer();
								break;

							case "HFS Data Store":
								scope.checkHFSPath();
								scope.checkHFSMaxFileDepth();
								scope.checkHFSMaxItems();
								break;

							case "DHuS Remote Data Store":
								scope.checkRMServiceUrl();
								scope.checkRMLogin();
								scope.checkRMPassword();
								break;

							case "GMP Data Store":
								scope.checkGMPRepoLocation();
								scope.checkGMPHFSLocation();
								scope.checkMaxQueuedRequest();

								//Quotas
								scope.checkGMPQuotasMaxQueryPerUser();
								scope.checkGMPQuotasTimespan();

								// MySQLConnectionInfo
								scope.checkGMPMySQLConnectionInfoDatabaseUrl();
								scope.checkGMPMySQLConnectionInfoUser();
								scope.checkGMPMySQLConnectionInfoPassword();

								//Configuration
								scope.checkGMPConfigurationAgentId();
								scope.checkGMPConfigurationTargetId();
								break;

							default:
								console.warn("cant identify data store type: ", dataStoreType);
								break;
						}
					};

					//Save Datastore clicked
					scope.save = function () {
						if (!scope.datastore.Type) {
							ToastManager.error("Please Select a Data Store Type");
							scope.resetFields();
							return;
						}

						//Validator
						scope.validator();

						if (!scope.checkFields) {
							console.error("Invalid fields for:", scope.datastore);
							return;
						}
						if (scope.isNew) {
							scope.createDatastore();
						} else {
							scope.updateDatastore();
						}
					};

					//CREATE
					scope.createDatastore = function () {
						var msg = "datastore creation failed";
						var bodyRequest = scope.createBodyrequest();
						var storedEviction = scope.datastore.Eviction;

						ODataDatastoreService.createDatastore(bodyRequest)
							.then(function (result) {
								if (result.status >= 200 && result.status <= 204) {
									ODataDatastoreService.getDatastoreList()
										.then(function (response) {
											DatastoreModel.createModel(response.data.value, response.data.value.length);
											ToastManager.success("datastore created");

											// Update Linked datastore
											if (storedEviction) {
												ODataDatastoreService.linkEvictionToDatastore(storedEviction, scope.datastore.Name);
											}
											scope.close();
										});
								} else {
									ToastManager.error(msg + (". Reason: " + result.data.error.message || ""));
								}
							}, function (result) {
								ToastManager.error(msg + (". Reason: " + result.data.error.message || ""));
							});
					};

					scope.createBodyrequest = function () {
						var bodyRequest = {};

						//BodyRequest Common fields
						bodyRequest.Name = scope.datastore.Name.replace(/\s/g, ''); //REPLACE BLANK FIELDS 
						bodyRequest.Priority = scope.datastore.Priority;
						bodyRequest.MaximumSize = scope.datastore.MaximumSize;
						bodyRequest.CurrentSize = scope.datastore.CurrentSize;
						bodyRequest.AutoEviction = scope.datastore.AutoEviction || false;
						bodyRequest.ReadOnly = scope.datastore.ReadOnly || false;

						bodyRequest.Type = scope.datastore.Type; //Type

						//bodyRequest Optional parameters based on Type
						switch (bodyRequest.Type) {
							case "Open Stack Data Store":
								bodyRequest.Provider = scope.datastore.Provider;
								bodyRequest.Identity = scope.datastore.Identity;
								bodyRequest.Credential = scope.datastore.Credential;
								bodyRequest.Url = scope.datastore.Url;
								bodyRequest.Region = scope.datastore.Region;
								bodyRequest.Container = scope.datastore.Container;
								break;

							case "HFS Data Store":
								bodyRequest.Path = scope.datastore.Path;
								bodyRequest.MaxFileDepth = scope.datastore.MaxFileDepth;
								bodyRequest.MaxItems = scope.datastore.MaxItems;
								break;

							case "DHuS Remote Data Store":
								bodyRequest.MaximumSize = undefined;
								bodyRequest.CurrentSize = undefined;
								bodyRequest.AutoEviction = undefined;

								bodyRequest.ServiceUrl = scope.datastore.ServiceUrl;
								bodyRequest.Login = scope.datastore.Login;
								bodyRequest.Password = scope.datastore.Password;
								break;

							case "GMP Data Store":
								bodyRequest.RepoLocation = scope.datastore.RepoLocation;
								bodyRequest.HFSLocation = scope.datastore.HFSLocation;
								bodyRequest.MaxQueuedRequest = scope.datastore.MaxQueuedRequest;
								bodyRequest.Quotas = {};
								bodyRequest.Quotas.MaxQueryPerUser = scope.datastore.QuotasMaxQueryPerUser;
								bodyRequest.Quotas.Timespan = scope.datastore.QuotasTimespan;
								bodyRequest.IsMaster = scope.datastore.IsMaster || false;
								bodyRequest.MySQLConnectionInfo = {};
								bodyRequest.MySQLConnectionInfo.DatabaseUrl = scope.datastore.MySQLConnectionInfoDatabaseUrl;
								bodyRequest.MySQLConnectionInfo.User = scope.datastore.MySQLConnectionInfoUser;
								bodyRequest.MySQLConnectionInfo.Password = scope.datastore.MySQLConnectionInfoPassword;
								bodyRequest.Configuration = {};
								bodyRequest.Configuration.AgentId = scope.datastore.ConfigurationAgentId;
								bodyRequest.Configuration.TargetId = scope.datastore.ConfigurationTargetId;
								break;

							default:
								console.warn("datastore-details case unknown");
								break;
						}
						return bodyRequest;
					};

					//UPDATE
					scope.updateDatastore = function () {
						var msg = "datastore update failed";
						var bodyRequest = scope.createBodyrequest();
						var storedEviction = scope.datastore.Eviction;

						ODataDatastoreService.updateDatastore(bodyRequest.Name, bodyRequest)
							.then(function (result) {
								if (result.status >= 200 && result.status <= 204) {
									ODataDatastoreService.getDatastoreList()
										.then(function (response) {
											DatastoreModel.createModel(response.data.value, response.data.value.length);
											ToastManager.success("datastore updated");

											if (storedEviction) {
												ODataDatastoreService.linkEvictionToDatastore(storedEviction, scope.datastore.Name);
											}
											scope.close();
										});
								} else {
									ToastManager.error(msg + (". Reason: " + result.data.error.message || ""));
								}
							}, function (result) {
								ToastManager.error(msg + (". Reason: " + result.data.error.message || ""));
							});
					};

					scope.resetErrorDivs = function () {
						$('#dscheckType').css('display', 'none');
						$('#dscheckName').css('display', 'none');
						$('#dscheckPriority').css('display', 'none');
						$('#dscheckMaximumSize').css('display', 'none');
						$('#dscheckCurrentSize').css('display', 'none');

						//OPEN STACK
						$('#dscheckProvider').css('display', 'none');
						$('#dscheckIdentity').css('display', 'none');
						$('#dscheckCredential').css('display', 'none');
						$('#dscheckUrl').css('display', 'none');
						$('#dscheckRegion').css('display', 'none');
						$('#dscheckContainer').css('display', 'none');

						//HFS
						$('#dscheckPath').css('display', 'none');
						$('#dscheckMaxFileDepth').css('display', 'none');
						$('#dscheckMaxItems').css('display', 'none');

						//Remote Datatore
						$('#dscheckRMServiceUrl').css('display', 'none');
						$('#dscheckRMLogin').css('display', 'none');
						$('#dscheckRMPassword').css('display', 'none');

						//GMP
						$('#dscheckGMPRepoLocation').css('display', 'none');
						$('#dscheckHFSLocation').css('display', 'none');
						$('#dscheckMaxQueuedRequest').css('display', 'none');
						$('#dscheckQuotasMaxQueryPerUser').css('display', 'none');
						$('#dscheckQuotasTimespan').css('display', 'none');
						$('#dscheckMySQLConnectionInfoDatabaseUrl').css('display', 'none');
						$('#dscheckMySQLConnectionInfoUser').css('display', 'none');
						$('#dscheckMySQLConnectionInfoPassword').css('display', 'none');
						$('#dscheckConfigurationAgentId').css('display', 'none');
						$('#dscheckConfigurationTargetId').css('display', 'none');
					};

					scope.resetFields = function () {
						//Common fields
						scope.datastore.Name = '';
						scope.datastore.Priority = '';
						scope.datastore.MaximumSize = '';
						scope.datastore.CurrentSize = '';
						scope.datastore.AutoEviction = false;
						scope.datastore.ReadOnly = false;

						//reset HFS Ffields
						scope.datastore.Path = '';
						scope.datastore.MaxFileDepth = '';
						scope.datastore.MaxItems = '';

						//reset Open Stack Fields fields
						scope.datastore.Provider = '';
						scope.datastore.Identity = '';
						scope.datastore.Credential = '';
						scope.datastore.Url = '';
						scope.datastore.Region = '';
						scope.datastore.Container = '';

						//reset Remote Datastore fields
						scope.datastore.ServiceUrl = '';
						scope.datastore.Login = '';
						scope.datastore.Password = '';

						//reset GMP Data Store fields
						scope.datastore.RepoLocation = '';
						scope.datastore.HFSLocation = '';
						scope.datastore.MaxQueuedRequest = '';
						scope.datastore.QuotasMaxQueryPerUser = '';
						scope.datastore.QuotasTimespan = '';
						scope.datastore.IsMaster = '';
						scope.datastore.MySQLConnectionInfoDatabaseUrl = '';
						scope.datastore.MySQLConnectionInfoUser = '';
						scope.datastore.MySQLConnectionInfoPassword = '';
						scope.datastore.ConfigurationAgentId = '';
						scope.datastore.ConfigurationTargetId = '';
					};

					//Close Panel
					scope.close = function () {
						$('#dsDetails').modal('hide');
					};

					scope.linkEvictionToDatastore = function () {
						ODataDatastoreService.linkEvictionToDatastore(scope.datastore.Eviction, scope.datastore.Name);
					};
				}
			};
		}
	};
});
  