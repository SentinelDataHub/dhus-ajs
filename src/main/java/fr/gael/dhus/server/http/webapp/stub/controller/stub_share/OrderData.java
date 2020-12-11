package fr.gael.dhus.server.http.webapp.stub.controller.stub_share;

import java.util.Date;

public class OrderData {
	
	private String id;
	private String status;
	private String statusMessage;
	private Date submissionTime;
	private Date estimatedTime;
	
	
	public OrderData() {		
		super();
	}
	
	public OrderData(String id, String status, 
		Date submissionTime, Date estimatedTime, String statusMessage) {
		super();
		this.id = id;
		this.status = status;
		this.statusMessage = statusMessage;
		this.submissionTime = submissionTime;
		this.estimatedTime = estimatedTime;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getStatusMessage() {
		return statusMessage;
	}

	public void setStatusMessage(String statusMessage) {
		this.statusMessage = statusMessage;
	}

	public Date getSubmissionTime() {
		return submissionTime;
	}

	public void setSubmissionTime(Date submissionTime) {
		this.submissionTime = submissionTime;
	}

	public Date getEstimatedTime() {
		return estimatedTime;
	}

	public void setEstimatedTime(Date estimatedTime) {
		this.estimatedTime = estimatedTime;
	}
	
	
}
