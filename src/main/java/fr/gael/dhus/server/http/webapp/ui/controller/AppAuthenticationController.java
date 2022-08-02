package fr.gael.dhus.server.http.webapp.ui.controller;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import fr.gael.dhus.service.exception.EmailNotSentException;
import fr.gael.dhus.service.exception.RootNotModifiableException;
import fr.gael.dhus.service.exception.UserAlreadyExistingException;
import fr.gael.dhus.service.exception.UserNotExistingException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.Header;
import org.apache.http.HeaderElement;
import org.apache.http.HttpResponse;

import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import fr.gael.dhus.database.object.User;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.UserData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.exceptions.UserServiceException;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.exceptions.UserServiceMailingException;
import fr.gael.dhus.service.UserService;
import fr.gael.dhus.spring.context.ApplicationContextProvider;
import fr.gael.dhus.spring.security.saml.SAMLUtil;
import fr.gael.dhus.system.config.ConfigurationManager;

@RestController
public class AppAuthenticationController {

	private static Log LOGGER = LogFactory.getLog(AppAuthenticationController.class);
	private final static String HEADER_CONTENT_TYPE = "Content-type";
	private final static String HEADER_CONTENT_TYPE_URL_ENCODED = "application/x-www-form-urlencoded";
	private final static String EQUAL = "=";
	private final static String SEMICOLON = ";";
	private final static String SAML_REQUEST = "SAMLRequest";
	private final static String SAML_RESPONSE = "SAMLResponse";
	private final static String FORM_ACTION = "action";
	private final static String FORM_NAME = "name";
	private final static String FORM_VALUE = "value";
	private final static String FORM_USERNAME = "username";
	private final static String FORM_PASSWORD = "password";
	private final static String HEADER_COOKIE = "Cookie";
	private final static String HEADER_SET_COOKIE = "Set-Cookie";
	private final static String HEADER_LOCATION = "Location";
	private final static String KEYCLOAK_IDENTITY_LEGACY = "KEYCLOAK_IDENTITY_LEGACY";
	private final static String KEYCLOAK_SESSION_LEGACY = "KEYCLOAK_SESSION_LEGACY";
	private final static String KEYCLOAK_SESSION = "KEYCLOAK_SESSION";
	private final static String DHUS_INTEGRITY = "dhusIntegrity";
	private final static String DHUS_AUTH = "dhusAuth";

	@Autowired
	private UserService userService;

	@Autowired
	private ConfigurationManager cfg;

	@RequestMapping(value = "/signup", method = RequestMethod.POST)
	public ResponseEntity<?> user(@RequestBody UserData userData)
			throws IOException, UserServiceMailingException, UserServiceException {

		fr.gael.dhus.service.UserService userService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.UserService.class);
		User user = new User();

		try {
			if (userData.getPassword() == "") {
				return new ResponseEntity<String>("{\"code\":\"user_password_required\"}", HttpStatus.BAD_REQUEST);
			}

			user.setUsername(userData.getUsername());
			user.setFirstname(userData.getFirstname());
			user.setLastname(userData.getLastname());
			user.setAddress(userData.getAddress());
			user.setEmail(userData.getEmail());
			user.setPhone(userData.getPhone());
			user.setPassword(userData.getPassword());
			user.setCountry(userService.getCountry(Long.parseLong(userData.getCountry())).getName());
			user.setUsage(userData.getUsage());
			user.setSubUsage(userData.getSubUsage());
			user.setDomain(userData.getDomain());
			user.setSubDomain(userData.getSubDomain());
			userService.createTmpUser(user);

		} catch (EmailNotSentException e) {
			throw new UserServiceMailingException(e.getMessage());
		} catch (UserAlreadyExistingException ex) {
			return new ResponseEntity<String>("{\"code\":\"user_already_present\"}", HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			e.printStackTrace();
			throw new UserServiceException(e.getMessage());
		}

		return new ResponseEntity<String>("{\"code\":\"OK\"}", HttpStatus.OK);
	}

	@RequestMapping(value = "/signup", method = RequestMethod.GET)
	public String signupValidate() {
		return "hello from unauthorized webservice";
	}

	@RequestMapping(value = "/forgotpwd", method = RequestMethod.POST)
	public ResponseEntity<?> forgotPassword(@RequestBody User user) throws RootNotModifiableException {
		int responseCode = 0;

		try {
			userService.forgotPassword(user, "#/home/r=");
		} catch (EmailNotSentException ex) {
			return new ResponseEntity<>("{\"code\":\"error-sending-email\"}", HttpStatus.INTERNAL_SERVER_ERROR);
		} catch (UserNotExistingException ex) {
			return new ResponseEntity<>("{\"code\":\"user-not-found\"}", HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return new ResponseEntity<>("{\"message\":\"" + e.getMessage() + "\",\"code\":\"generic-error\"}",
					HttpStatus.BAD_REQUEST);
		}

		return new ResponseEntity<>("{\"code\":\"" + responseCode + "\"}", HttpStatus.OK);
	}

	/**
	 * Check User code in order to allow password reset
	 *
	 * @return user code or error message in json format
	 */
	@RequestMapping(value = "/resetpwd", method = RequestMethod.POST)
	public ResponseEntity<?> resetPassword(@RequestParam(value = "code", defaultValue = "") String code,
			@RequestParam(value = "password", defaultValue = "") String password) {
		fr.gael.dhus.service.UserService userService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.UserService.class);

		try {
			userService.resetPassword(code, password);
		} catch (org.springframework.security.access.AccessDeniedException e) {
			e.printStackTrace();
			return new ResponseEntity<>("{\"code\":\"unauthorized\"}", HttpStatus.FORBIDDEN);
		} catch (EmailNotSentException e) {
			e.printStackTrace();
			return new ResponseEntity<>("{\"code\":\"email_not_sent\"}", HttpStatus.INTERNAL_SERVER_ERROR);
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
		return new ResponseEntity<>("{\"code\":\"success\"}", HttpStatus.OK);

	}

	/**
	 * Login used when GDPR is enabled
	 *
	 * @return token or error message in json format
	 */
	@RequestMapping(value = "/login", method = RequestMethod.POST)
	public ResponseEntity<?> login(HttpServletRequest req,
			@RequestBody UserData user, HttpServletResponse res) {
		Map<String, String> cookies = null;
		try {
			final int port = req.getServerPort();
			String samlEndpoint;
			String extPath = cfg.getServerConfiguration().getExternalPath();
            if(extPath != null && !extPath.trim().isEmpty())
            {
				if (extPath.endsWith("/")) {
               		extPath = extPath.substring(0, extPath.length() - 1);
				}
				if (extPath.startsWith("/")) {
					extPath = extPath.substring(1);

				}
				samlEndpoint = extPath + "/saml/";
            } else {
				samlEndpoint = "saml/";
			}
			
			String samlUrl = String.format("%s://%s/%s", req.getScheme(), req.getServerName(), samlEndpoint);
            
            if (port != 80 && port != 443)
            {
               samlUrl = String.format("%s://%s:%d/%s", req.getScheme(), req.getServerName(), port, samlEndpoint);
            }
            // get token
			cookies = getCookies(samlUrl, user.getUsername(), user.getPassword());
			LOGGER.debug("cookies: " + cookies);
			if (cookies == null ) {
				return new ResponseEntity<>("{\"code\":\"unauthorized\"}", HttpStatus.UNAUTHORIZED);
			} else {
				for (Cookie cookie: getSessionCookies(cookies, extPath)) {
					res.addCookie(cookie);
				}				
			} 
		} catch (org.springframework.security.access.AccessDeniedException e) {
			e.printStackTrace();
			return new ResponseEntity<>("{\"code\":\"unauthorized\"}", HttpStatus.FORBIDDEN);
		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
		return new ResponseEntity<>("{\"username\":\""+ SAMLUtil.hash(user.getUsername()) + "\"}", HttpStatus.OK);

	}

	private static Map<String, String> getCookies(final String url, final String user, final String pwd) {
		Map<String, String> cookies = null;
		HttpClient client = HttpClientBuilder.create().build();
		HttpGet getRequest = new HttpGet();
		HttpPost postRequest = new HttpPost();
		do {
			try {
				///////////////////
				//// GET http://dhus_ip:port/odata/v1/Products (example)
				///////////////////
				HttpResponse response = get(client, getRequest, url, null);
				if (response.getStatusLine().getStatusCode() != HttpStatus.OK.value()) {
					break;
				}
				///////////////////
				//// POST http://keycloak_ip:port/auth/realms/dhus/protocol/saml (example)
				//// + data : SAMLRequest
				///////////////////
				String content = EntityUtils.toString(response.getEntity());
				List<NameValuePair> nvps = new ArrayList<NameValuePair>();
				nvps.add(new BasicNameValuePair(SAML_REQUEST, getFormFieldValueByName(content, SAML_REQUEST)));
				response = post(client, postRequest, sanitizeUrl(getFormFieldValueByName(content, FORM_ACTION)), nvps);
				if (response.getStatusLine().getStatusCode() != HttpStatus.FOUND.value()) {
					break;
				}
				///////////////////
				//// GET
				/////////////////// http://keycloak_ip:port/auth/realms/dhus/login-actions/authenticate?client_id=dhus_client&tab_id=4LruigNgVCs
				/////////////////// (example)
				//// + cookies : AUTH_SESSION_ID_LEGACY + KC_RESTART + ...
				///////////////////
				response = get(client, getRequest, response.getFirstHeader(HEADER_LOCATION).getValue(),
						getSetCookieHeaderAsString(response.getHeaders(HEADER_SET_COOKIE)));
				if (response.getStatusLine().getStatusCode() != HttpStatus.OK.value()) {
					break;
				}
				///////////////////
				//// POST
				/////////////////// http://keycloak_ip:port/auth/realms/dhus/login-actions/authenticate?session_code=tC6iF4jbxNccd0SjR2a9ZMG6EA_Ln_uTT-auoK597W4&execution=ccdef0c0-2ef2-429a-acbc-1fd5152e92e9&
				//// client_id=dhus_client&tab_id=4LruigNgVCs (example)
				//// + data : username + password
				///////////////////
				content = EntityUtils.toString(response.getEntity());
				nvps.clear();
				nvps.add(new BasicNameValuePair(FORM_USERNAME, user));
				nvps.add(new BasicNameValuePair(FORM_PASSWORD, pwd));
				response = post(client, postRequest, sanitizeUrl(getFormFieldValueByName(content, FORM_ACTION)), nvps);
				if (response.getStatusLine().getStatusCode() != HttpStatus.OK.value()) {
					break;
				}
				///////////////////
				//// POST http://dhus_ip:port/saml/saml/SSO (example)
				//// + data : SAMLResponse
				///////////////////
				content = EntityUtils.toString(response.getEntity());
				nvps.clear();
				nvps.add(new BasicNameValuePair(SAML_RESPONSE, getFormFieldValueByName(content, SAML_RESPONSE)));
				response = post(client, postRequest, getFormFieldValueByName(content, FORM_ACTION), nvps);
				if (response.getStatusLine().getStatusCode() != HttpStatus.FOUND.value()) {
					break;
				}
				cookies = getSetCookieHeaderAsMap(response.getHeaders(HEADER_SET_COOKIE));
												
			} catch (IOException e) {
				LOGGER.error("Authentication error : Basic to SAML authentication processing.");
				LOGGER.error(e.getMessage());
			}
		} while (false);

		if (getRequest != null) {
			getRequest.releaseConnection();
		}
		if (postRequest != null) {
			postRequest.releaseConnection();
		}
		return cookies;
	}

	private static HttpResponse get(final HttpClient client, final HttpGet get, final String url, final String cookie) {
		HttpResponse result = null;
		if (client == null || get == null || url == null || url.isEmpty()) {
			return result;
		}
		try {
			get.reset();
			get.setURI(new URI(url));
			if (cookie != null && !cookie.isEmpty()) {
				get.setHeader(HEADER_COOKIE, cookie);
			}
			result = client.execute(get);
		} catch (IOException | URISyntaxException e) {
			e.printStackTrace();
		}
		return result;
	}

	private static HttpResponse post(final HttpClient client, final HttpPost post, final String url,
			final List<NameValuePair> data) {
		HttpResponse result = null;
		if (client == null || post == null || url == null || url.isEmpty()) {
			return result;
		}
		try {
			post.reset();
			post.setURI(new URI(url));
			post.setHeader(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_URL_ENCODED);
			post.setEntity(new UrlEncodedFormEntity(data));
			result = client.execute(post);
		} catch (IOException | URISyntaxException e) {
			e.printStackTrace();
		}
		return result;
	}

	private static String getFormFieldValueByName(final String form, final String field) {
		final int nameIndex = form.indexOf(String.format("%s=\"%s\"", FORM_NAME, field));
		if (nameIndex > 0) {
			final int valueIndex = form.indexOf(String.format("%s=\"", FORM_VALUE), nameIndex) + 7;
			return form.substring(valueIndex, form.indexOf("\"", valueIndex));
		}
		final int fieldIndex = form.indexOf(String.format("%s=\"", field)) + field.length() + 2;
		if (fieldIndex > 0) {
			return form.substring(fieldIndex, form.indexOf("\"", fieldIndex));
		}
		return null;
	}

	private static String sanitizeUrl(final String url) {
		return url.replaceAll("&#x3a;", ":").replaceAll("&#x2f;", "/").replaceAll("&amp;", "&");
	}

	private static String getSetCookieHeaderAsString(final Header[] headers) {
		StringBuilder sb = new StringBuilder();
		for (Header head : headers) {
			for (HeaderElement el : head.getElements()) {
				final String name = el.getName();
				sb.append(name);
				sb.append(EQUAL);
				sb.append(el.getValue());
				sb.append(SEMICOLON);
			}
		}
		return sb.toString();
	}

	private static Map<String, String> getSetCookieHeaderAsMap(final Header[] headers) {
		Map<String, String> result = new HashMap<String, String>();
		for (Header head : headers) {
			for (HeaderElement el : head.getElements()) {
				result.put(el.getName(), el.getValue());
			}
		}

		return result;
	}
	
	private static List<Cookie> getSessionCookies(Map<String, String> cookies, String extPath) {
		List<Cookie> cookiesList = new ArrayList<>();
		Cookie cookie = null;
		String cookiePath;

		try {
			if(extPath == null || extPath.trim().isEmpty())
            {
               // if no external path, then use saml
			   cookiePath = "/";
            }
            else
            {
               // if external path, then use external_path/saml
               cookiePath = "/" + extPath + "/";
            }
			cookie = new Cookie(DHUS_AUTH, cookies.get(DHUS_AUTH));
			cookie.setPath(cookiePath);
			cookiesList.add(cookie);
			cookie = new Cookie(DHUS_INTEGRITY, cookies.get(DHUS_INTEGRITY));
			cookie.setPath(cookiePath);
			cookiesList.add(cookie);
			
		} catch(Exception e) {
			LOGGER.error("Error getting Cookies: " + e.getMessage());
		}
		return cookiesList;
		
	}

}