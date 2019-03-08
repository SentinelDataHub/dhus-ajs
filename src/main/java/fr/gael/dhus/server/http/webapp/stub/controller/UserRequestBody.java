package fr.gael.dhus.server.http.webapp.stub.controller;

import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.UserData;

public class UserRequestBody{
	private UserData user;
	 private PasswordModel pm;

	public void setUser(UserData u) {
		this.user = u;
	}

	public UserData getUser() {
			  return user;
		  }
	public void setPm(PasswordModel pm) {
			   this.pm = pm;
		   }
	public PasswordModel getPm() {
			   return this.pm;
		   }
	public PasswordModel getPasswordModel() {
			  return pm;
		  }
		  
 }