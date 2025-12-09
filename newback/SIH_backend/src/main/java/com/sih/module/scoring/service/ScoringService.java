package com.sih.module.scoring.service;

import com.sih.common.config.FailSafeConfig;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import com.sih.module.scoring.dto.AssessmentResponse;
import com.sih.module.scoring.entity.CreditAssessment;
import com.sih.module.scoring.entity.MLModel;
import com.sih.module.scoring.repository.CreditAssessmentRepository;
import com.sih.module.scoring.repository.MLModelRepository;
import com.sih.module.scoring.entity.RegionalParameter;
import com.sih.module.scheme.service.SchemeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringService {

    private final CreditAssessmentRepository assessmentRepository;
    private final MLModelRepository modelRepository;
    private final LoanApplicationRepository applicationRepository;
    private final BeneficiaryProfileRepository beneficiaryRepository;
    private final MLModelService mlModelService;

    private final FailSafeConfig failSafeConfig;

    @Transactional
    public AssessmentResponse assessApplication(Long applicationId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        BeneficiaryProfile profile = beneficiaryRepository.findByUserUserId(application.getUser().getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary profile not found"));

        // Fail-safe: Get active ML model, but continue with rule-based scoring if
        // unavailable
        MLModel model = null;
        try {
            model = modelRepository.findByIsActiveTrue().orElse(null);
        } catch (Exception e) {
            log.warn("Failed to load ML model, using rule-based scoring: {}", e.getMessage());
        }

        // Calculate raw income score (always works - rule-based)
        BigDecimal rawIncome = profile.getVerifiedAnnualIncome() != null ? profile.getVerifiedAnnualIncome()
                : BigDecimal.ZERO;
        BigDecimal rawIncomeScore = calculateIncomeScore(rawIncome);

        // Apply regional adjustment (always works - uses database)
        // Apply regional adjustment (Dummy implementation for now)
        RegionalParameter regionalParam = new RegionalParameter(BigDecimal.ONE);
        try {
            // TODO: Implement actual regional parameter logic within scoring module
            // For now, just use default factor
            regionalParam.setCostAdjustmentFactor(BigDecimal.ONE);
        } catch (Exception e) {
            log.warn("Failed to get regional parameter, using default: {}", e.getMessage());
        }

        BigDecimal adjustedIncome = rawIncome.multiply(regionalParam.getCostAdjustmentFactor());
        BigDecimal adjustedIncomeScore = calculateIncomeScore(adjustedIncome);

        // Calculate credit risk score (rule-based, always works)
        BigDecimal creditRiskScore = calculateCreditRiskScore(profile);

        // Fail-safe: Use ML model if available and enabled, otherwise use rule-based
        BigDecimal mlRiskScore = null;
        String mlExplanation = null;
        String mlRiskCategory = null;
        Map<String, Object> mlRiskResult = null;
        Map<String, Object> mlIncomeResult = null;
        
        if (model != null) {
            try {
                // Call ML Risk Classification API
                Map<String, Object> riskInputData = buildRiskInputData(application, profile);
                mlRiskResult = mlModelService.predictRiskScore(riskInputData);
                
                if (mlRiskResult != null) {
                    mlRiskScore = BigDecimal.valueOf((Double) mlRiskResult.get("risk_score"));
                    mlRiskCategory = (String) mlRiskResult.get("risk_category");
                    mlExplanation = (String) mlRiskResult.get("explanation");
                    log.info("ML Risk Score: {}, Category: {}", mlRiskScore, mlRiskCategory);
                    
                    // Call ML Income Classification API
                    try {
                        mlIncomeResult = mlModelService.predictIncomeCategory(riskInputData);
                        log.info("ML Income Category: {}", mlIncomeResult != null ? mlIncomeResult.get("predicted_category") : "null");
                    } catch (Exception e) {
                        log.warn("ML income prediction failed: {}", e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("ML model call failed, using rule-based score: {}", e.getMessage());
            }
        }


        // Composite score (weighted average)
        // If ML score available, use it with higher weight; otherwise use rule-based
        BigDecimal compositeScore;
        if (mlRiskScore != null) {
            // ML-enhanced scoring: 50% ML, 30% income, 20% rule-based risk
            compositeScore = mlRiskScore.multiply(BigDecimal.valueOf(0.5))
                    .add(adjustedIncomeScore.multiply(BigDecimal.valueOf(0.3)))
                    .add(creditRiskScore.multiply(BigDecimal.valueOf(0.2)))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            // Pure rule-based fallback
            compositeScore = rawIncomeScore.multiply(BigDecimal.valueOf(0.4))
                    .add(adjustedIncomeScore.multiply(BigDecimal.valueOf(0.3)))
                    .add(creditRiskScore.multiply(BigDecimal.valueOf(0.3)))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Determine risk band
        String riskBand = determineRiskBand(compositeScore);
        String eligibilityStatus = determineEligibility(compositeScore);

        // Explainability data
        Map<String, Object> explainabilityData = new HashMap<>();
        explainabilityData.put("rawIncome", rawIncome);
        explainabilityData.put("adjustedIncome", adjustedIncome);
        explainabilityData.put("regionalFactor", regionalParam.getCostAdjustmentFactor());
        explainabilityData.put("literacyScore", profile.getLiteracyScore());
        explainabilityData.put("scoringMethod", mlRiskScore != null ? "ML_ENHANCED" : "RULE_BASED");
        
        if (mlRiskScore != null) {
            explainabilityData.put("mlRiskScore", mlRiskScore);
            explainabilityData.put("mlRiskCategory", mlRiskCategory);
            explainabilityData.put("mlExplanation", mlExplanation);
        }

        String explainabilitySummary;
        if (mlRiskScore != null) {
            explainabilitySummary = String.format(
                    "ML-Enhanced Score: %.2f (ML Risk: %.2f, Income: %.2f, Rule Risk: %.2f). %s",
                    compositeScore, mlRiskScore, adjustedIncomeScore, creditRiskScore,
                    mlExplanation != null ? mlExplanation.split("\\n")[0] : ""
            );
        } else {
            explainabilitySummary = String.format(
                    "Rule-Based Score: %.2f (Income: %.2f, Regional: %.2f, Risk: %.2f)",
                    compositeScore, rawIncomeScore, adjustedIncomeScore, creditRiskScore
            );
        }
        
        // Save ML explanations to beneficiary profile if ML models were used
        if (mlRiskResult != null) {
            saveMlExplanationsToProfile(profile, mlRiskResult, mlIncomeResult, compositeScore);
        }
        
        // Update beneficiary profile with composite score and explanations
        profile.setCompositeScore(compositeScore);
        profile.setRiskBucket(riskBand);
        profile.setScoreTimestamp(java.time.OffsetDateTime.now());
        if (mlIncomeResult != null && mlIncomeResult.get("predicted_category") != null) {
            profile.setIncomeBucket((String) mlIncomeResult.get("predicted_category"));
        }
        beneficiaryRepository.save(profile);

        CreditAssessment assessment = CreditAssessment.builder()
                .application(application)
                .rawIncomeScore(rawIncomeScore)
                .adjustedIncomeScore(adjustedIncomeScore)
                .creditRiskScore(creditRiskScore)
                .compositeScore(compositeScore)
                .riskBand(riskBand)
                .eligibilityStatus(eligibilityStatus)
                .explainabilityData(explainabilityData)
                .explainabilitySummary(explainabilitySummary)
                .model(model)
                .build();

        assessment = assessmentRepository.save(assessment);
        log.info("Assessment completed for application: {} - Score: {}", applicationId, compositeScore);

        return mapToResponse(assessment);

    }

    public AssessmentResponse getAssessment(Long applicationId) {
        CreditAssessment assessment = assessmentRepository.findByApplicationApplicationId(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        return mapToResponse(assessment);
    }

    private BigDecimal calculateIncomeScore(BigDecimal income) {
        // Normalize income to 0-100 scale
        // Assuming max income of 500000
        if (income.compareTo(BigDecimal.ZERO) == 0)
            return BigDecimal.ZERO;
        BigDecimal score = income.divide(BigDecimal.valueOf(5000), 2, RoundingMode.HALF_UP);
        return score.min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateCreditRiskScore(BeneficiaryProfile profile) {
        // Simplified risk calculation
        BigDecimal baseScore = BigDecimal.valueOf(50);

        if (profile.getIsProfileVerified()) {
            baseScore = baseScore.add(BigDecimal.valueOf(20));
        }

        if (profile.getLiteracyScore() != null && profile.getLiteracyScore() > 50) {
            baseScore = baseScore.add(BigDecimal.valueOf(10));
        }

        return baseScore.min(BigDecimal.valueOf(100));
    }

    private String determineRiskBand(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(70)) >= 0)
            return "LOW";
        if (score.compareTo(BigDecimal.valueOf(40)) >= 0)
            return "MEDIUM";
        return "HIGH";
    }

    private String determineEligibility(BigDecimal score) {
        return score.compareTo(BigDecimal.valueOf(50)) >= 0 ? "ELIGIBLE" : "NOT_ELIGIBLE";
    }

    private Map<String, Object> buildRiskInputData(LoanApplication application, BeneficiaryProfile profile) {
        Map<String, Object> inputData = new HashMap<>();
        
        // Add all available features from application and profile
        // Note: The ML model will handle missing features
        
        // Profile data
        if (profile.getVerifiedAnnualIncome() != null) {
            inputData.put("annual_family_income", profile.getVerifiedAnnualIncome().doubleValue());
        }
        if (profile.getFamilySize() != null) {
            inputData.put("family_size", profile.getFamilySize());
        }
        if (profile.getDependencyCount() != null) {
            inputData.put("dependents_count", profile.getDependencyCount());
        }
        
        // Application data
        if (application.getRequestedAmount() != null) {
            inputData.put("loan_amount", application.getRequestedAmount().doubleValue());
        }
        if (application.getTenureMonths() != null) {
            inputData.put("tenure_months", application.getTenureMonths());
        }
        
        // Add any other relevant fields that your ML model expects
        // The ML model's cols_to_drop will filter out what it doesn't need
        
        return inputData;
    }

    private AssessmentResponse mapToResponse(CreditAssessment assessment) {
        return AssessmentResponse.builder()
                .assessmentId(assessment.getAssessmentId())
                .applicationId(assessment.getApplication().getApplicationId())
                .rawIncomeScore(assessment.getRawIncomeScore())
                .adjustedIncomeScore(assessment.getAdjustedIncomeScore())
                .creditRiskScore(assessment.getCreditRiskScore())
                .compositeScore(assessment.getCompositeScore())
                .riskBand(assessment.getRiskBand())
                .eligibilityStatus(assessment.getEligibilityStatus())
                .explainabilityData(assessment.getExplainabilityData())
                .explainabilitySummary(assessment.getExplainabilitySummary())
                .modelId(assessment.getModel() != null ? assessment.getModel().getModelId() : null)
                .assessedAt(assessment.getAssessedAt())
                .build();
    }
    
    /**
     * Save comprehensive ML explanations to beneficiary profile with categorical interpretations
     * Converts SHAP values and feature importance into human-readable risk factor labels
     */
    private void saveMlExplanationsToProfile(BeneficiaryProfile profile, Map<String, Object> riskResult, 
                                              Map<String, Object> incomeResult, BigDecimal compositeScore) {
        try {
            Map<String, Object> explanations = new HashMap<>();
            
            // Risk Model Explanations
            if (riskResult != null) {
                Map<String, Object> riskModel = new HashMap<>();
                riskModel.put("score", riskResult.get("risk_score"));
                riskModel.put("category", riskResult.get("risk_category"));
                riskModel.put("modelVersion", riskResult.get("model_version"));
                riskModel.put("timestamp", java.time.OffsetDateTime.now().toString());
                
                // Process top factors with categorical interpretations
                if (riskResult.containsKey("top_factors")) {
                    List<Map<String, Object>> topFactors = (List<Map<String, Object>>) riskResult.get("top_factors");
                    List<Map<String, Object>> interpretedFactors = new java.util.ArrayList<>();
                    
                    for (Map<String, Object> factor : topFactors) {
                        Map<String, Object> interpretedFactor = new HashMap<>();
                        String featureName = (String) factor.get("feature");
                        // ML API returns "score" not "shap_value"
                        Double consensusScore = ((Number) factor.get("score")).doubleValue();
                        
                        // Interpret feature name to human-readable
                        String displayName = interpretFeatureName(featureName);
                        interpretedFactor.put("name", displayName);
                        
                        // Interpret consensus score to categorical impact
                        // Positive score = increases risk, Negative score = decreases risk (protective)
                        String impact = interpretShapValue(consensusScore, featureName);
                        interpretedFactor.put("impact", impact);
                        
                        // Store original consensus score for reference
                        interpretedFactor.put("shapValue", consensusScore);
                        
                        // Add description based on feature and impact
                        String description = generateFactorDescription(featureName, consensusScore, impact);
                        interpretedFactor.put("description", description);
                        
                        interpretedFactors.add(interpretedFactor);
                    }
                    
                    riskModel.put("topFactors", interpretedFactors);
                }
                
                explanations.put("riskModel", riskModel);
            }
            
            // Income Model Explanations
            if (incomeResult != null) {
                Map<String, Object> incomeModel = new HashMap<>();
                incomeModel.put("predictedCategory", incomeResult.get("predicted_category"));
                incomeModel.put("confidence", incomeResult.get("confidence"));
                
                if (incomeResult.containsKey("probabilities")) {
                    incomeModel.put("probabilities", incomeResult.get("probabilities"));
                }
                
                explanations.put("incomeModel", incomeModel);
            }
            
            // Composite Score and Trend
            explanations.put("compositeScore", compositeScore);
            
            // Calculate score trend if previous score exists
            if (profile.getCompositeScore() != null) {
                Map<String, Object> scoreTrend = new HashMap<>();
                BigDecimal previousScore = profile.getCompositeScore();
                BigDecimal change = compositeScore.subtract(previousScore);
                BigDecimal changePercent = previousScore.compareTo(BigDecimal.ZERO) > 0 
                    ? change.divide(previousScore, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
                
                scoreTrend.put("previousScore", previousScore);
                scoreTrend.put("change", change);
                scoreTrend.put("changePercent", changePercent);
                scoreTrend.put("period", "MONTHLY");
                
                explanations.put("scoreTrend", scoreTrend);
            }
            
            // Convert to JSON string and save
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String jsonExplanations = objectMapper.writeValueAsString(explanations);
            profile.setMlExplanations(jsonExplanations);
            
            log.info("Saved ML explanations to profile for user: {}", profile.getUser().getUserId());
            
        } catch (Exception e) {
            log.error("Failed to save ML explanations: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Interpret SHAP value to categorical impact label
     * Positive SHAP = increases risk (bad), Negative SHAP = decreases risk (good)
     */
    private String interpretShapValue(Double shapValue, String featureName) {
        double absValue = Math.abs(shapValue);
        
        // For risk-increasing features (positive SHAP)
        if (shapValue > 0) {
            if (absValue > 0.15) return "HIGH_RISK";
            if (absValue > 0.08) return "MODERATE_RISK";
            return "LOW_RISK";
        } 
        // For risk-decreasing features (negative SHAP - protective)
        else {
            if (absValue > 0.15) return "VERY_GOOD";
            if (absValue > 0.08) return "GOOD";
            return "NEUTRAL";
        }
    }
    
    /**
     * Convert technical feature names to human-readable display names
     */
    private String interpretFeatureName(String featureName) {
        Map<String, String> featureMap = Map.ofEntries(
            Map.entry("payment_history", "Payment History"),
            Map.entry("income_stability", "Income Stability"),
            Map.entry("dependency_ratio", "Dependency Ratio"),
            Map.entry("past_borrowing", "Past Borrowing"),
            Map.entry("annual_family_income", "Family Income"),
            Map.entry("loan_amount", "Loan Amount"),
            Map.entry("tenure_months", "Loan Tenure"),
            Map.entry("family_size", "Family Size"),
            Map.entry("dependents_count", "Number of Dependents"),
            Map.entry("age", "Age"),
            Map.entry("education_level", "Education Level"),
            Map.entry("employment_type", "Employment Type")
        );
        
        return featureMap.getOrDefault(featureName, 
            // Fallback: capitalize and replace underscores
            java.util.Arrays.stream(featureName.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                .collect(java.util.stream.Collectors.joining(" "))
        );
    }
    
    /**
     * Generate human-readable description for each risk factor
     */
    private String generateFactorDescription(String featureName, Double shapValue, String impact) {
        boolean isProtective = shapValue < 0;
        
        Map<String, String> positiveDescriptions = Map.ofEntries(
            Map.entry("payment_history", "Consistent payment record"),
            Map.entry("income_stability", "Stable income sources"),
            Map.entry("past_borrowing", "Good repayment history"),
            Map.entry("annual_family_income", "Adequate family income"),
            Map.entry("education_level", "Higher education level")
        );
        
        Map<String, String> negativeDescriptions = Map.ofEntries(
            Map.entry("payment_history", "Irregular payment patterns"),
            Map.entry("income_stability", "Variable income sources"),
            Map.entry("dependency_ratio", "High number of dependents"),
            Map.entry("loan_amount", "High loan amount relative to income"),
            Map.entry("past_borrowing", "Limited credit history")
        );
        
        if (isProtective) {
            return positiveDescriptions.getOrDefault(featureName, "Positive indicator");
        } else {
            return negativeDescriptions.getOrDefault(featureName, "Risk indicator");
        }
    }
}
