package com.sih.module.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    @Value("${app.sms.fast2sms.url}")
    private String apiUrl;

    @Value("${app.sms.fast2sms.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String sendSms(String phoneNumber, String message) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Fast2SMS API key is not configured. SMS to {} will not be sent.", phoneNumber);
            return "SKIPPED_NO_KEY";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("route", "q"); // Quick SMS route
            body.put("message", message);
            body.put("language", "english");
            body.put("flash", 0);
            body.put("numbers", phoneNumber);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("SMS sent successfully to {}", phoneNumber);
                return "SUCCESS: " + response.getBody();
            } else {
                log.error("Failed to send SMS to {}. Status: {}", phoneNumber, response.getStatusCode());
                return "FAILED: " + response.getStatusCode() + " - " + response.getBody();
            }
        } catch (Exception e) {
            log.error("Exception sending SMS to {}: {}", phoneNumber, e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
}
