package fr.gael.dhus.server.http.webapp.stub.controller.stub_share;

import java.util.Date;

public class TransformationData {
	
	private String id;  //means transformation UUID
	private String status;
	private Date submissionTime; //means creationDate
	private String transformer;
	private String productIn; //means productIn UUID
	private String productOut; //means productIn UUID
	private String resultUrl;
	
	public TransformationData() {		
		super();
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

	public Date getSubmissionTime() {
		return submissionTime;
	}

	public void setSubmissionTime(Date submissionTime) {
		this.submissionTime = submissionTime;
	}

	public String getTransformer() {
		return transformer;
	}

	public void setTransformer(String transformer) {
		this.transformer = transformer;
	}

	public String getProductIn() {
		return productIn;
	}

	public void setProductIn(String productIn) {
		this.productIn = productIn;
	}

	public String getProductOut() {
		return productOut;
	}

	public void setProductOut(String productOut) {
		this.productOut = productOut;
	}

	public String getResultUrl() {
		return resultUrl;
	}

	public void setResultUrl(String resultUrl) {
		this.resultUrl = resultUrl;
	}
	
	public String toString() {
		return "id: " + this.id + ",productIn: " + this.productIn + ",productOut: " + this.productOut + ",resultUrl: " 
				+ this.resultUrl + ",status: " + this.status + ",transformer: " + this.transformer; 
	}
	
	

}
