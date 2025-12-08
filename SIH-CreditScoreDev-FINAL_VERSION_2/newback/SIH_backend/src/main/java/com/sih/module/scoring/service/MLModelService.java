package com.sih.module.scoring.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.module.scoring.entity.MLModel;
import com.sih.module.scoring.repository.MLModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLModelService {

    private final MLModelRepository mlModelRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ml.risk.api.url:http://localhost:5001}")
    private String riskApiUrl;

    @Value("${ml.income.api.url:http://localhost:5002}")
    private String incomeApiUrl;

    @Value("${ml.risk.model.version:v1}")
    private String defaultRiskModelVersion;

    /**
     * Predict risk score using ML model
     */
    public Map<String, Object> predictRiskScore(Map<String, Object> inputData) {
        return predictRiskScore(inputData, defaultRiskModelVersion);
    }

    /**
     * Predict risk score using specific model version
     */
    public Map<String, Object> predictRiskScore(Map<String, Object> inputData, String modelVersion) {
        try {
            log.info("Calling Risk ML API at {} with version {}", riskApiUrl, modelVersion);

            // Add model version to request
            inputData.put("model_version", modelVersion);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(inputData, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    riskApiUrl + "/predict",
                    request,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                // Parse response
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());

                if (jsonResponse.isArray() && jsonResponse.size() > 0) {
                    JsonNode result = jsonResponse.get(0);

                    Map<String, Object> mlResult = new HashMap<>();
                    mlResult.put("risk_score", result.get("risk_score").asDouble());
                    mlResult.put("risk_category", result.get("risk_category").asText());
                    mlResult.put("explanation", result.get("explanation").asText());
                    mlResult.put("model_version", result.get("model_version").asText());
                    mlResult.put("num_features", result.get("num_features").asInt());

                    // Extract top factors
                    if (result.has("top_factors")) {
                        mlResult.put("top_factors", objectMapper.convertValue(
                                result.get("top_factors"),
                                List.class
                        ));
                    }

                    log.info("Risk prediction successful: score={}, category={}",
                            mlResult.get("risk_score"), mlResult.get("risk_category"));

                    return mlResult;
                }
            }

            log.warn("Risk ML API returned unexpected response: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("Error calling Risk ML API: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Predict income category using ML model
     */
    public Map<String, Object> predictIncomeCategory(Map<String, Object> inputData) {
        try {
            log.info("Calling Income ML API at {}", incomeApiUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(inputData, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    incomeApiUrl + "/predict",
                    request,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());

                if (jsonResponse.isArray() && jsonResponse.size() > 0) {
                    JsonNode result = jsonResponse.get(0);

                    Map<String, Object> mlResult = new HashMap<>();
                    if (result.has("prediction")) {
                        mlResult.put("predicted_category", result.get("prediction").asText());
                    } else if (result.has("predicted_category")) {
                         mlResult.put("predicted_category", result.get("predicted_category").asText());
                    }
                    
                    if (result.has("confidence")) {
                        mlResult.put("confidence", result.get("confidence").asDouble());
                    }
                    
                    if (result.has("explanation")) {
                        mlResult.put("explanation", result.get("explanation").asText());
                    }
                    
                    if (result.has("model_version")) {
                        mlResult.put("model_version", result.get("model_version").asText());
                    }

                    // Extract probabilities
                    if (result.has("probabilities")) {
                        mlResult.put("probabilities", objectMapper.convertValue(
                                result.get("probabilities"),
                                Map.class
                        ));
                    }

                    log.info("Income prediction successful: category={}, confidence={}",
                            mlResult.get("predicted_category"), mlResult.get("confidence"));

                    return mlResult;
                }
            }

            log.warn("Income ML API returned unexpected response: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("Error calling Income ML API: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Check health of Risk ML API
     */
    public boolean checkRiskApiHealth() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    riskApiUrl + "/health",
                    String.class
            );
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.error("Risk ML API health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check health of Income ML API
     */
    public boolean checkIncomeApiHealth() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    incomeApiUrl + "/health",
                    String.class
            );
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.error("Income ML API health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Switch risk model version
     */
    /**
     * Switch risk model version
     */
    public boolean switchRiskModelVersion(String version) {
        try {
            log.info("Switching risk model to version: {}", version);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    riskApiUrl + "/models/switch/" + version,
                    null,
                    String.class
            );

            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.error("Error switching risk model version: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Switch income model version
     */
    public boolean switchIncomeModelVersion(String version) {
        try {
            log.info("Switching income model to version: {}", version);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    incomeApiUrl + "/models/switch/" + version,
                    null,
                    String.class
            );

            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.error("Error switching income model version: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get all ML models from database
     */
    public List<MLModel> getAllModels() {
        return mlModelRepository.findAll();
    }

    /**
     * Activate a specific model
     */
    public void activateModel(Long modelId) {
        // Deactivate all models
        mlModelRepository.findAll().forEach(model -> {
            model.setIsActive(false);
            mlModelRepository.save(model);
        });

        // Activate the selected model
        MLModel model = mlModelRepository.findById(modelId)
                .orElseThrow(() -> new RuntimeException("Model not found"));

        model.setIsActive(true);
        mlModelRepository.save(model);

        log.info("Activated model: {}", model.getName());
    }

    /**
     * Get detailed Flask model information
     */
    public Map<String, Object> getFlaskModelInfo() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Get info from Risk API
            ResponseEntity<String> response = restTemplate.getForEntity(
                    riskApiUrl + "/models/info",
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                result.put("risk_api", objectMapper.convertValue(jsonResponse, Map.class));
            }
        } catch (Exception e) {
            log.error("Error fetching Risk API model info: {}", e.getMessage());
            result.put("risk_api", Map.of("error", e.getMessage()));
        }
        
        try {
            // Get info from Income API
            ResponseEntity<String> response = restTemplate.getForEntity(
                    incomeApiUrl + "/models/info",
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                result.put("income_api", objectMapper.convertValue(jsonResponse, Map.class));
            }
        } catch (Exception e) {
            log.error("Error fetching Income API model info: {}", e.getMessage());
            result.put("income_api", Map.of("error", e.getMessage()));
        }
        
        return result;
    }

    /**
     * Get health status of all Flask APIs
     */
    public Map<String, Boolean> getFlaskHealthStatus() {
        Map<String, Boolean> health = new HashMap<>();
        health.put("risk_api", checkRiskApiHealth());
        health.put("income_api", checkIncomeApiHealth());
        return health;
    }

    /**
     * Trigger model retraining (placeholder for future implementation)
     */
    public void triggerRetraining() {
        log.info("Model retraining triggered - this is a placeholder");
        // TODO: Implement actual retraining logic
        // This could involve calling a separate training service or queueing a training job
    }
}
