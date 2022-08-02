/*
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016,2017,2018 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016,2017,2018 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016,2017,2018 Serco Spa
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
angular.module('DHuS-webclient').directive('userDialog', function ($location, UserService,
    UserInfoService, AuthenticationService, AdvancedSearchService, ConfigurationService, Session, CartMenuService, CartStatusService) {

    //Close badge when clicking away from it
    ($(document)).mousedown(function (e) {
        var container = $('#userBadge');
        if (!container.is(e.target) && container.has(e.target).length == 0)
            container.hide();
    });
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'components/user-dialog/view.html',
        scope: {
            text: "="
        },
        compile: function (tElem, tAttrs) {
            return {
                pre: function (scope, iElem, iAttrs) {
                    scope.showsignup = ApplicationService.settings.signup;
                    scope.forgotpassword = ApplicationService.settings.forgotpassword;
                    scope.gdpr = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.enabled : false;
					scope.showUsername = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.showUsername : true;
					scope.gdpr.gdprEditProfileUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.editProfileUrl : "#/home";
					scope.gdpr.gdprForgotUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.forgotPasswordUrl : "#/home";
					scope.gdpr.gdprSignupUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.signupdUrl : "#/home";
					scope.gdpr.target = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.target : "_blank";
                    if (!ConfigurationService.isLoaded()) {
                        ConfigurationService.getConfiguration().then(function (data) {
                            if (data) { // promise fulfilled
                                ApplicationService = data;
                                scope.showsignup = ApplicationService.settings.signup;
                                scope.forgotpassword = ApplicationService.settings.forgotpassword;
                                scope.hideLoginTitle = ApplicationService.settings.hide_login_title;
                                scope.loginTitle = ApplicationService.settings.login_title ? ApplicationService.settings.login_title : "Please login to access our services…";
                                scope.gdpr = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.enabled : false;
								scope.showUsername = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.showUsername : true;
								scope.gdprEditProfileUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.editProfileUrl : "#/home";
								scope.gdprForgotUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.forgotPasswordUrl : "#/home";
								scope.gdprSignupUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.signupUrl : "#/home";
								scope.target = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.target : "_blank";
                    
                            } else { }
                        }, function (error) { // promise rejected, could log the error with: console.log('error', error);
                        });
                    }
                    else {
                        scope.showsignup = ApplicationService.settings.signup;
						scope.forgotpassword = ApplicationService.settings.forgotpassword;
                    	scope.gdpr = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.enabled : false;
						scope.showUsername = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.showUsername : true;
						scope.gdprEditProfileUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.editProfileUrl : "#/home";
						scope.gdprForgotUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.forgotPasswordUrl : "#/home";
						scope.gdprSignupUrl = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.signupUrl : "#/home";
						scope.target = ApplicationService.settings.gdpr ? ApplicationService.settings.gdpr.target : "_blank";
					}
                },
                post: function (scope, iElem, iAttrs) {
                    scope.userInfo = UserInfoService.userInfo;
                    scope.isManagement = false;
                    scope.isSynchroUser = false;
                    scope.isUploadUser = false;
                    scope.isRootUser = false;
                    scope.showsignup = false;
                    scope.forgotpassword = false;
                    scope.username;
                    scope.password;
                    scope.samlUrl = ApplicationConfig.baseUrl + "saml"

                    function init() {
                        UserDetailsManager.setUserDetails(function () { scope.getUserDetails(); });
                    }

                    scope.getUserDetails = function () {
                        if (scope.userInfo.isLogged) {
                            scope.user = UserService.model;
                            scope.editprofile = ApplicationService.settings.editprofile;
                            scope.showcart = ApplicationService.settings.showcart;
                            if (!scope.user || !scope.user.username) {
                                scope.getUser();
                            } else if (Session.getSessionUsername() && scope.user.username.localeCompare(Session.getSessionUsername()) != 0) {
                                scope.getUser();
                            }
                            else {
                                scope.getInfoByRole(scope.user.roles);
                                scope.isRootUser =
                                    (scope.user && scope.user.username.localeCompare(ApplicationService.settings.superuser) == 0) ? true : false;
                            }
                        } else {
                            $('#wronglogin').html('');
                            $('#loginUsername').focus();

                        }
                        if ($('.callout').css('display') == 'none') {
                            $('.callout').css('display', 'inline-block');
                            $('.notch').css('display', 'inline-block');
                        }
                        else {
                            $('.callout').css('display', 'none');
                            $('.notch').css('display', 'none');
                        }
                    };
                    scope.closeBadge = function () {
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                    };
                    scope.editProfile = function () {
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                        CartStatusService.setIsUserDialog(true);
                        location.href = '#/user-profile';
                    };
                    scope.loadCart = function () {
                        console.warn('OLD CART FUNCTION');
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                        location.href = '#/user-cart';
                    };
                    scope.loadSearches = function () {
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                        // CartStatusService.setIsUserDialog(true);
                        location.href = '#/user-searches';
                    };
                    scope.loadManagement = function () {
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                        CartStatusService.setIsUserDialog(true);
                        location.href = '#/management';
                    };
                    scope.loadSynchronizers = function () {
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                        CartStatusService.setIsUserDialog(true);
                        location.href = '#/odata-synchronizer';
                    };
                    scope.loadUpload = function () {
                        $('.callout').css('display', 'none');
                        $('.notch').css('display', 'none');
                        CartStatusService.setIsUserDialog(true);
                        location.href = '#/upload-product';
                    };

                    scope.userDialogGoCart = function () {
                        // console.log('userDialogGoCart, CartStatusService.getIsUserDialog() is ', CartStatusService.getIsUserDialog());

                        if (CartStatusService.getIsUserDialog() === true) {
                            scope.closeBadge(); 
                            window.location.replace("#/home");
                        } else {
                            if (CartMenuService.model.hidden)
                                CartMenuService.show();
                            else CartMenuService.hide();
                        }
                    };

                    scope.login = function () {
                        var self = this;
                        if (scope.username !== null) { //Username field not null
                            scope.username = scope.username.toLowerCase();
                            AuthenticationService.login(scope.username, scope.password, self).success(function (response) {
                                UserService.getODataUser(scope.username).then(function (res) {

                                    window.user = scope.username;
                                    AuthenticationService.logged = true;
                                    AuthenticationService.basicAuth = window.btoa(scope.username + ':' + scope.password);
                                    Session.setSessionUsername(scope.username);
                                    Session.updateSession();
                                    UserService.setUserModel(res);
                                    UserService.setUserRolesModel(res);
                                    scope.manageLoginResult();
                                    ToastManager.success("Login successful!");
                                    CartStatusService.setIsUserDialog(false);
                                    //Routing to #/home
                                    window.location.replace("#/home");
                                },

                                    function (data) {
                                        AuthenticationService.logout()
                                            .success(function () {
                                                ToastManager.error("Login failed");
                                                $('#wronglogin').html('Login failed.\n Please try again.');
                                            })
                                            .error(function () {
                                                ToastManager.error("Login failed");
                                                $('#wronglogin').html('Login failed.\n Please try again.');
                                            });
                                    });
                            })
                                .error(function (response) {
                                    ToastManager.error("Login failed");
                                    $('#wronglogin').html('The username and password you entered don\'t match.');
                                });
                        } else { //Username field is empty
                            ToastManager.error("Login failed");
                            $('#wronglogin').html('The username and password you entered don\'t match.');
                        }
                    };

					scope.loginGdpr = function () {
                        var self = this;
                        if (scope.username !== null) { //Username field not null
                            scope.username = scope.username.toLowerCase();
							
                            AuthenticationService.loginGdpr(scope.username, scope.password, self).success(function (response) {
								console.log(response);
								scope.username = response.username;
                                UserService.getODataUser(scope.username).then(function (res) {

                                    window.user = scope.username;
                                    AuthenticationService.logged = true;
                                    AuthenticationService.basicAuth = window.btoa(scope.username + ':' + scope.password);
                                    Session.setSessionUsername(scope.username);
                                    Session.updateSession();
                                    UserService.setUserModel(res);
                                    UserService.setUserRolesModel(res);
                                    scope.manageLoginResult();
                                    ToastManager.success("Login successful!");
                                    CartStatusService.setIsUserDialog(false);
                                    //Routing to #/home
                                    window.location.replace("#/home");
                                },

                                    function (data) {
                                        AuthenticationService.logout()
                                            .success(function () {
                                                ToastManager.error("Login failed");
                                                $('#wronglogin').html('Login failed.\n Please try again.');
                                            })
                                            .error(function () {
                                                ToastManager.error("Login failed");
                                                $('#wronglogin').html('Login failed.\n Please try again.');
                                            });
                                    });
                            })
                                .error(function (response) {
                                    ToastManager.error("Login failed");
                                    $('#wronglogin').html('The username and password you entered don\'t match.');
                                });
                        } else { //Username field is empty
                            ToastManager.error("Login failed");
                            $('#wronglogin').html('The username and password you entered don\'t match.');
                        }
                    };


                    scope.signup = function () {
                        location.href = '#/self-registration';
                    };

                    scope.manageLoginResult = function () {
                        scope.userInfo.isLogged = true;
                        this.closeBadge();
                    };

                    scope.getUser = function () {
                        UserService.getUser()
                            .then(function (result) {
                                scope.user = result;
                                scope.getInfoByRole(scope.user.roles);
                                scope.isRootUser =
                                    (scope.user && scope.user.username.localeCompare(ApplicationService.settings.superuser) == 0) ? true : false;
                            });
                    };

                    scope.logout = function () {
                        AuthenticationService.logout()
                            .success(function (response) {
                                CartMenuService.hide();
                                ToastManager.success("Logout successful");
                                scope.closeBadge();
                                scope.userInfo.isLogged = false;
                                window.location.replace("#/home");
                            })
                            .error(function (response) {
                                ToastManager.error("Logout failed");
                            });
                    };

					scope.logoutGdpr = function () {
                        AuthenticationService.logoutGdpr()
                            .success(function (response) {
                                CartMenuService.hide();
                                ToastManager.success("Logout successful");
                                scope.closeBadge();
                                scope.userInfo.isLogged = false;
                                window.location.replace("#/home");
                            })
                            .error(function (response) {
                                ToastManager.error("Logout failed");
                            });
                    };

                    scope.getInfoByRole = function (roles) {
                        var divrole = $('#roles');
                        var role = "";
                        scope.isManagement = false;
                        scope.isSynchroUser = false;
                        scope.isUploadUser = false;

                        if (roles) {
                            var availableRoles = ApplicationService.settings.availableRoles;
                            var roleId = "";
                            availableRoles.forEach(function (entry) {
                                roleId = "#role_" + entry.id;
                                $(roleId).hide();
                            });

                            roles.forEach(function (entry) {
                                role = "#role_" + entry;
                                if (_.contains(ApplicationService.settings.managementRoles, entry))
                                    scope.isManagement = true;
                                if (_.contains(ApplicationService.settings.synchronizerRoles, entry))
                                    scope.isSynchroUser = true;
                                if (_.contains(ApplicationService.settings.uploadRoles, entry))
                                    scope.isUploadUser = true;
                                $(role).show();
                            });
                        }
                    };
                    init();
                }
            };
        }
    };
});
