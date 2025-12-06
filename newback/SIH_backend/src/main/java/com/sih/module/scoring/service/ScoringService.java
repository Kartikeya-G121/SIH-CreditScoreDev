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
        
        if (model != null) {
            try {
                // Call ML Risk Classification API
                Map<String, Object> riskInputData = buildRiskInputData(application, profile);
                Map<String, Object> mlResult = mlModelService.predictRiskScore(riskInputData);
                
                if (mlResult != null) {
                    mlRiskScore = BigDecimal.valueOf((Double) mlResult.get("risk_score"));
                    mlRiskCategory = (String) mlResult.get("risk_category");
                    mlExplanation = (String) mlResult.get("explanation");
                    log.info("ML Risk Score: {}, Category: {}", mlRiskScore, mlRiskCategory);
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
}
