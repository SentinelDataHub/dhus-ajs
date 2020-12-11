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
angular.module('DHuS-webclient').directive('userDetails', function(
  $location, $document, $window, ConfigurationService, AdminUserService) {
  var countries = null;
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/user-details/view.html',
    scope: {
      text: "="
    },
    compile: function (tElem, tAttrs) {
      return {
        pre: function (scope, iElem, iAttrs) {
        },
        post: function (scope, iElem, iAttrs) {
          scope.temp = {};
          scope.user = {};
          scope.users = {};
          scope.checkFields = true;
          scope.nextbutton = {};
          scope.prevbutton = {};
          scope.isNew = false;

          scope.domains = [
            'Atmosphere',
            'Emergency',
            'Marine',
            'Land',
            'Security',
            'Climate',
            'Other'
          ];
          scope.usages = [
            'Research',
            'Commercial',
            'Education',
            'Other'
          ];

          function init() {
            scope.availableRoles = ApplicationService.settings.availableRoles;
            if (!ConfigurationService.isLoaded()) {
              ConfigurationService.getConfiguration().then(function (data) {
                if (data) {
                  ApplicationService = data;
                  scope.availableRoles = ApplicationService.settings.availableRoles;
                }
              }, function (error) {
              });
            }
          }

          //Set User Details
          AdminUserDetailsManager.setUserDetails(function (userId, userList, isNew) {
            scope.getUserDetails(userId, userList, isNew);
          });

          //User Initialization
          function initUser(userId, model, isNew) {
            if (isNew) {
              scope.user = {};
              scope.resetFields();
            }
            getCountries(userId, model, isNew);
          }

          function cleanRoles() {
            var role = "";
            if (scope.availableRoles) {
              scope.availableRoles.forEach(function (entry) {
                role = "#userRole_" + entry.id;
                $(role).prop('checked', false);
              });
            }
          }

          function selectAllRoles() {
            var role = "";
            if (scope.availableRoles) {
              scope.availableRoles.forEach(function (entry) {
                role = "#userRole_" + entry.id;
                $(role).prop('checked', true);
              });
            }
          }

          function selectUserRoles(userRoles) {
            var role = "";
            if (userRoles) {
              userRoles.forEach(function (entry) {
                role = "#userRole_" + entry;
                $(role).prop('checked', true);
              });
            }
          }

          function getCountries(userId, model, isNew) {
            if (!scope.countries) {
              AdminUserService.getCountries()
                .then(function (result) {
                  if (result.status == 200) {
                    countries = result.data;
                    scope.countries = countries;
                    scope.loadUserInfo(userId, model, isNew);
                  }
                  else {
                    ToastManager.error("error getting countries list");
                    scope.loadUserInfo(userId, model, isNew);
                  }
                }, function (result) {
                  ToastManager.error("error getting countries list");
                  scope.loadUserInfo(userId, model, isNew);
                });
            }
            else
              scope.loadUserInfo(userId, model, isNew);
          }

          scope.selectUnselectAll = function () {
            if (scope.selected) {
              selectAllRoles();
            }
            else {
              cleanRoles();
            }
          };

          scope.loadUserInfo = function (userId, model, isNew) {
            if (isNew) {
              scope.nextbutton.disabled = true;
              scope.prevbutton.disabled = true;
              return;
            }

            scope.currentUuid = userId;
            if (model) {
              scope.currentList = model;
              scope.users.list = model;
            }

            if (scope.currentList) {

              for (var i = 0; i < scope.currentList.length; i++) {
                if (scope.currentList[i].uuid == userId) {
                  var user = scope.currentList[i];

                  scope.user = user;
                  scope.temp = _.clone(scope.user);


                  if (scope.user.lockedReason)
                    scope.isLocked = true;
                  else
                    scope.isLocked = false;
                  selectUserRoles(scope.user.roles);

                  if ((i + 1) < scope.currentList.length) {

                    scope.nextUuid = scope.currentList[i + 1].uuid;
                    scope.nextbutton.disabled = false;
                  } else {
                    scope.nextbutton.disabled = true;
                  }
                  if ((i - 1) >= 0) {
                    scope.prevbutton.disabled = false;
                    scope.prevUuid = scope.currentList[i - 1].uuid;
                  } else {

                    scope.prevbutton.disabled = true;
                  }
                }
              }
            }
            scope.checkUsage();
            scope.checkDomain();
          };

          scope.showNextUser = function () {
            scope.getUserDetails(scope.nextUuid, null, false);
          };

          scope.showPrevUser = function () {
            scope.getUserDetails(scope.prevUuid, null, false);
          };

          scope.getUserDetails = function (userId, model, isNew) {
            cleanRoles();
            scope.isNew = isNew;
            initUser(userId, model, isNew);

            if (!$('#userView').hasClass('in'))
              $('#userView').modal('show');
          };

          scope.checkUsage = function () {
            var check = true;
            if (!scope.user.usage || scope.user.usage == 'unknown' || scope.user.usage.trim() == '') {
              $('#admincheckUsage').css('display', 'inline-block');
              $('#adminusageLbl').css('display', 'none');
              check = false;
            }
            else {
              $('#admincheckUsage').css('display', 'none');
              $('#adminusageLbl').css('display', 'inline-block');
            }
            if (scope.user.usage == "Other") {
              $('#adminusageDesc').show();
            }
            else {
              $('#adminusageLabel').hide();
              $('#adminusageDesc').hide();
              $('#admincheckSubUsage').hide();
            }
            scope.checkFields = scope.checkFields && check;
          };

          scope.checkDomain = function () {
            var check = true;
            if (!scope.user.domain || scope.user.domain == 'unknown' || scope.user.domain.trim() == '') {
              $('#admincheckDomain').css('display', 'inline-block');
              $('#admindomainLbl').css('display', 'none');
              check = false;
            }
            else {
              $('#admincheckDomain').css('display', 'none');
              $('#admindomainLbl').css('display', 'inline-block');
            }
            if (scope.user.domain == "Other") {
              $('#admindomainDesc').show();
            }
            else {
              $('#admindomainLabel').hide();
              $('#admindomainDesc').hide();
              $('#admincheckSubDomain').hide();
            }
            scope.checkFields = scope.checkFields && check;
          };

          scope.checkUsername = function () {
            var check = true;
            if (!scope.user.username || scope.user.username.trim() == "") {
              $('#admincheckUsername').css('display', 'inline-block');
              $('#adminusernameLbl').css('display', 'none');
              check = false;
            }
            else {
              $('#admincheckUsername').css('display', 'none');
              $('#adminusernameLbl').css('display', 'inline-block');
            }
            scope.checkFields = scope.checkFields && check;
          };

          scope.checkName = function () {
            var check = true;
            if (!scope.user.firstname || scope.user.firstname.trim() == "") {
              $('#admincheckName').css('display', 'inline-block');
              $('#adminfirstnameLbl').css('display', 'none');
              check = false;
            }
            else {
              $('#admincheckName').css('display', 'none');
              $('#adminfirstnameLbl').css('display', 'inline-block');
            }
            scope.checkFields = scope.checkFields && check;

          };
          scope.checkLastname = function () {

            var check = true;
            if (!scope.user.lastname || scope.user.lastname.trim() == "") {
              $('#admincheckLastname').css('display', 'inline-block');
              $('#adminlastnameLbl').css('display', 'none');
              check = false;
            }
            else {
              $('#admincheckLastname').css('display', 'none');
              $('#adminlastnameLbl').css('display', 'inline-block');
            }
            scope.checkFields = scope.checkFields && check;

          };
          scope.checkEmail = function () {

            var check = true;
            var email = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$');
            var useremail = $('#adminemail').val();
            if (!scope.user.email || scope.user.email.trim() == "") {
              $('#admincheckEmail').css('display', 'inline-block');
              $('#adminemailLbl').css('display', 'none');
              check = false;
            }
            else if (!email.test(useremail.toUpperCase())) {
              $('#admincheckEmail').css('display', 'inline-block');
              $('#adminemailLbl').css('display', 'inline-block');
              check = false;
            }
            else {
              $('#admincheckEmail').css('display', 'none');
              $('#adminemailLbl').css('display', 'inline-block');
            }
            scope.checkFields = scope.checkFields && check;
          };

          scope.checkSubDomain = function () {
            var check = true;
            if ($('#admindomainDesc').is(':visible')) {
              if (!scope.user.subDomain || scope.user.subDomain == 'unknown') {
                $('#admincheckSubDomain').css('display', 'inline-block');
                $('#admindomailLabel').css('display', 'none');
                check = false;
              }
              else {
                $('#admincheckSubDomain').css('display', 'none');
                $('#admindomailLabel').css('display', 'inline-block');
              }
            }
            scope.checkFields = scope.checkFields && check;
          };

          scope.checkSubUsage = function () {
            var check = true;
            if ($('#adminusageDesc').is(':visible')) {
              if (!scope.user.subUsage || scope.user.subUsage == 'unknown') {
                $('#admincheckSubUsage').css('display', 'inline-block');
                $('#adminusageLabel').css('display', 'none');
                check = false;
              }
              else {
                $('#admincheckSubUsage').css('display', 'none');
                $('#adminusageLabel').css('display', 'inline-block');
              }
            }
            scope.checkFields = scope.checkFields && check;
          };


          scope.checkCountry = function () {
            var check = true;
            if (!scope.user.country || scope.user.country == 'unknown' || scope.user.country == '' || scope.user.country == 'Select your country') {
              $('#admincheckCountry').css('display', 'inline-block');
              $('#admincountryLbl').css('display', 'none');
              check = false;
            }
            else {
              $('#checkCountry').css('display', 'none');
              $('#countryLbl').css('display', 'inline-block');
            }
            scope.checkFields = scope.checkFields && check;
          };

          scope.clearReason = function () {
            if (!scope.isLocked) {
              scope.user.lockedReason = '';
            }
          };

          scope.checkIsLocked = function () {
            if (scope.user.lockedReason != null)
              scope.isLocked = true;
            else
              scope.isLocked = false;
          };

          scope.checkAndUpdateUserInfo = function () {
            scope.checkFields = true;
            scope.checkUsername();
            scope.checkName();
            scope.checkLastname();
            scope.checkEmail();
            scope.checkDomain();
            scope.checkSubDomain();
            scope.checkUsage();
            scope.checkSubUsage();
            scope.checkCountry();
            if (!scope.isLocked) {
              delete scope.user['lockedReason'];
            }
            else {
              if (scope.user.lockedReason == null)
                scope.user.lockedReason = "";
            }
          };

          scope.save = function () {
            scope.checkAndUpdateUserInfo();
            if (scope.checkFields) {
              updateUserRoles();
              scope.user.country = getCountryIdByName().toString();

              if (scope.isNew)
                scope.createUser();
              else
                scope.updateUser();
            }
          };

          function updateUserRoles() {
            var role = "";
            var roleObj;
            scope.user.roles = [];
            if (scope.availableRoles) {
              scope.availableRoles.forEach(function (entry) {
                role = "#userRole_" + entry.id;
                roleObj = $(role).prop('checked');
                if (roleObj)
                  scope.user.roles.push(entry.id);
              });
            }
          }

          scope.createUser = function () {
            AdminUserService.createUser(scope.user)
              .then(function (result) {

                if (result.status == 200) {
                  AdminUserService.getUsersList();
                  ToastManager.success("user creation succeeded.");
                  scope.close();
                }
                else if (result.data && result.data.code == "email_not_sent") {
                  AdminUserService.getUsersList();
                  var msg = 'User ' + scope.user.username + ' has been created, but there was an error while sending an email to user'
                    + '. Please contact an administrator. Cannot send email to ' + scope.user.email;
                  AlertManager.error("User Creation Error", msg);
                  scope.close();
                }
                else if (result.data && result.data.code == "unauthorized") {
                  AdminUserService.getUsersList();
                  ToastManager.error("user creation failed. unauthorized");
                }
                else {
                  AdminUserService.getUsersList();
                  ToastManager.error("user creation failed");
                }
              }, function (result) {
                AdminUserService.getUsersList();
                ToastManager.error("user creation failed");
              });
          };

          scope.updateUser = function () {
            AdminUserService.updateUser(scope.user)
              .then(function (result) {

                if (result.status == 200) {
                  AdminUserService.getUsersList();
                  ToastManager.success("user update succeeded.");
                  scope.close();
                }
                else if (result.data && result.data.code == "email_not_sent") {
                  AdminUserService.getUsersList();
                  var msg = 'User ' + scope.user.username + ' has been updated, but there was an error while sending an email to user'
                    + '. Please contact an administrator. Cannot send email to ' + scope.user.email;
                  AlertManager.error("User Update Error", msg);
                  scope.close();
                }
                else if (result.data && result.data.code == "unauthorized") {
                  AdminUserService.getUsersList();
                  ToastManager.error("user update failed. unauthorized");
                }
                else {
                  AdminUserService.getUsersList();
                  ToastManager.error("user update failed");
                }

              }, function (result) {

                AdminUserService.getUsersList();
                ToastManager.error("user update failed");
              });
          };

          function getCountryIdByName() {
            var index = _.findIndex(scope.countries, function (element) {
              return (element.name == scope.user.country)
            });
            return scope.countries[index] ? scope.countries[index].id : -1;
          }

          scope.resetFields = function () {
            scope.user.usage = 'unknown';
            scope.user.domain = 'unknown';
            scope.user.country = 'unknown';
            scope.user.username = '';
            scope.user.firstname = '';
            scope.user.lastname = '';
            scope.user.email = '';
            scope.user.subDomain = '';
            scope.user.subUsage = '';
            scope.user.lockedReason = '';
            scope.isLocked = false;
            scope.selected = false;
            cleanRoles();
          };

          scope.close = function () {
            
            //Restore
            if (scope.currentList) {
              for (var i = 0; i < scope.currentList.length; i++) {
                if (scope.currentList[i].uuid == scope.currentUuid) {
                  //Restore with old values
                  scope.currentList[i] = scope.temp;
                }
              }
            }  

            $('#userView').modal('hide');
          };
          init();
        }
      };
    }
  };
});
