/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.gael.dhus.server.http.webapp.stub.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.net.URL;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author dcaristo
 */
@RestController
public class AppConfigController {
    private static Log logger = LogFactory.getLog(AppConfigController.class);
    
    @RequestMapping(value = "/configuration", method = RequestMethod.GET)
	public ResponseEntity<?> getAppConfig() throws JSONException, FileNotFoundException, IOException {
		URL configFile = ClassLoader.getSystemResource("../etc/conf/appconfig.json");
		if (configFile != null) {
			logger.debug("Loading configuration file " + configFile.getPath());

			try {

				File file = new File(configFile.getPath());
				FileReader fileReader = new FileReader(file);
				BufferedReader bufferedReader = new BufferedReader(fileReader);
				String line = "";
				StringBuffer sb = new StringBuffer();
				while ((line = bufferedReader.readLine()) != null) {
					sb.append(line);
				}
				bufferedReader.close();
				JSONObject appconfig = new JSONObject(sb.toString());				
				return new ResponseEntity<>(appconfig.toString(), HttpStatus.OK);
			} catch (IOException e) {

				logger.error(" Cannot load appconfig file content");
				e.printStackTrace();
				return new ResponseEntity<>("{\"code\":\"not_found\"}",
						HttpStatus.NOT_FOUND);
			}
		} else {
			logger.error(" Cannot get appconfig file ");
			return new ResponseEntity<>("{\"code\":\"not_found\"}",
					HttpStatus.NOT_FOUND);
		}

	}
    
}
