package com.sih.module.scoring.service;

import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import com.sih.module.consumption.entity.ConsumptionEntry;
import com.sih.module.consumption.repository.ConsumptionEntryRepository;
import com.sih.module.scoring.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringEngineService {

    private final LoanApplicationRepository loanApplicationRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final ConsumptionEntryRepository consumptionEntryRepository;
    private final com.sih.module.loan.repository.LoanRepository loanRepository;
    private final com.sih.module.loan.repository.RepaymentRepository repaymentRepository;
    
    // Instantiate directly if no bean is configured
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ml.income.api.url:http://localhost:5002/predict}")
    private String incomeModelUrl;

    @Value("${ml.risk.api.url:http://localhost:5001/predict}")
    private String riskModelUrl;

    /**
     * Orchestrates the scoring process for a loan application.
     * Updates the application with scoring results and determines the final status.
     */
    @Transactional
    public void calculateScore(Long applicationId) {
        log.info("Starting scoring calculation for application ID: {}", applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        // 1. Fetch Data
        BeneficiaryProfile profile = beneficiaryProfileRepository.findByUserUserId(application.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("Beneficiary profile not found for user: " + application.getUser().getUserId()));

        List<ConsumptionEntry> consumptionEntries = consumptionEntryRepository.findByUserUserId(application.getUser().getUserId());

        // 2. Call Income Model
        try {
            IncomeModelInput incomeInput = prepareIncomePayload(profile, consumptionEntries);
            IncomeModelOutput incomeOutput = callIncomeApi(incomeInput);
            
            application.setIncomeBucket(incomeOutput.getPrediction());
            application.setIncomeConfidence(BigDecimal.valueOf(incomeOutput.getConfidence()));
            log.info("Income Model Result: Bucket={}, Confidence={}", incomeOutput.getPrediction(), incomeOutput.getConfidence());
        } catch (Exception e) {
            log.error("Error calling Income Model", e);
            // Default or fallback logic could be here
        }

        // 3. Call Risk Model
        try {
            RiskModelInput riskInput = prepareRiskPayload(profile, application);
            RiskModelOutput riskOutput = callRiskApi(riskInput);
            
            application.setRiskScore(BigDecimal.valueOf(riskOutput.getRiskScore()));
            application.setRiskBucket(riskOutput.getRiskCategory());
            log.info("Risk Model Result: Score={}, Bucket={}", riskOutput.getRiskScore(), riskOutput.getRiskCategory());
        } catch (Exception e) {
            log.error("Error calling Risk Model", e);
        }

        // 4. Determine Final Status (Composite Logic)
        determineFinalStatus(application);

        // 5. Update Beneficiary Profile with latest scores
        updateBeneficiaryProfile(profile, application);

        loanApplicationRepository.save(application);
        log.info("Scoring completed for application ID: {}", applicationId);
    }

    /**
     * Recalculates scores for all active applications of a user.
     * Triggered by Bill Uploads or other user-level events.
     */
    @Async
    @Transactional
    public void recalculateScoreForUser(Long userId) {
        log.info("Triggering score recalculation for user: {}", userId);
        List<LoanApplication> activeApps = loanApplicationRepository.findByUserUserId(userId);
        
        // Filter for relevant statuses if needed (e.g., only APPROVED or SANCTIONED for ongoing risk monitoring, 
        // or SCORING/SUBMITTED for initial processing)
        // For now, simple loop
        for (LoanApplication app : activeApps) {
            if (!"REJECTED".equals(app.getStatus()) && !"WITHDRAWN".equals(app.getStatus())) {
                calculateScore(app.getApplicationId());
            }
        }
    }

    private IncomeModelInput prepareIncomePayload(BeneficiaryProfile profile, List<ConsumptionEntry> entries) {
        // Aggregate consumption data
        // Logic: Filter by source type and calculate means
        // This is a simplified aggregation. In production, this should be more robust (group by month etc).
        
        Double electricityMean = calculateMean(entries, "ELECTRICITY");
        Double gasMean = calculateMean(entries, "GAS"); // assuming "GAS" is the source code
        Double mobileMean = calculateMean(entries, "MOBILE"); // assuming "MOBILE"
        Double unitsMean = calculateUnitsMean(entries, "ELECTRICITY");
        
        // Sum total utility spend roughly
        Double totalUtility = (electricityMean != null ? electricityMean : 0) + 
                              (gasMean != null ? gasMean : 0) + 
                              (mobileMean != null ? mobileMean : 0);

        return IncomeModelInput.builder()
                .beneficiaryId("BEN_" + profile.getProfileId()) // Mock ID format
                .householdSize(profile.getFamilySize() != null ? profile.getFamilySize() : 4) // Default 4
                .state(profile.getState())
                .district(profile.getDistrict())
                .electricityBillingAmountMean(electricityMean != null ? electricityMean : 0.0)
                .gasRefillAmtMean(gasMean != null ? gasMean : 0.0)
                .mobileRechargeAmountMean(mobileMean != null ? mobileMean : 0.0)
                .unitsConsumedMean(unitsMean != null ? unitsMean : 0.0)
                .totalMonthlyUtilitySpend(totalUtility)
                .build();
    }

    private RiskModelInput prepareRiskPayload(BeneficiaryProfile profile, LoanApplication app) {
        // Calculate actual repayment metrics from user's loan history
        RepaymentMetrics metrics = calculateRepaymentMetrics(profile.getUser().getUserId());
        
        return RiskModelInput.builder()
                .beneficiaryId("BEN_" + profile.getProfileId())
                .age(calculateAge(profile))
                .gender(profile.getGender())
                // .maritalStatus(profile.getMaritalStatus()) // Need to check if this exists in entity
                .education_level(profile.getEducation())
                .family_size(profile.getFamilySize())
                .dependents_count(profile.getDependencyCount())
                .annual_family_income(profile.getVerifiedAnnualIncome() != null ? profile.getVerifiedAnnualIncome().doubleValue() : 0.0)
                .income_source(profile.getIncomeSource())
                .loan_amount(app.getRequestedAmount().doubleValue())
                .tenure_months(app.getTenureMonths())
                .interest_rate(0.0) // Default 0.0 since not yet sanctioned
                .emi_amount(0.0)    // Default 0.0
                .late_payments(metrics.getLatePayments())
                .missed_payments(metrics.getMissedPayments())
                .average_delay_days(metrics.getAverageDelayDays())
                .build();
    }

    private Double calculateMean(List<ConsumptionEntry> entries, String dataSource) {
        OptionalDouble average = entries.stream()
                .filter(e -> dataSource.equalsIgnoreCase(e.getDataSource()))
                .filter(e -> e.getBillingAmount() != null)
                .mapToDouble(e -> e.getBillingAmount().doubleValue())
                .average();
        return average.isPresent() ? average.getAsDouble() : null;
    }

    private Double calculateUnitsMean(List<ConsumptionEntry> entries, String dataSource) {
        OptionalDouble average = entries.stream()
                .filter(e -> dataSource.equalsIgnoreCase(e.getDataSource()))
                .filter(e -> e.getUnitsConsumed() != null)
                .mapToDouble(e -> e.getUnitsConsumed().doubleValue())
                .average();
        return average.isPresent() ? average.getAsDouble() : null;
    }

    private Integer calculateAge(BeneficiaryProfile profile) {
        if (profile.getDob() == null) return 30; // Default
        return java.time.Period.between(profile.getDob(), java.time.LocalDate.now()).getYears();
    }

    private IncomeModelOutput callIncomeApi(IncomeModelInput input) {
        String url = incomeModelUrl.endsWith("/predict") ? incomeModelUrl : incomeModelUrl + "/predict";
        try {
             log.info("Calling Income API at: {}", url);
             log.info("Income API Request: {}", objectMapper.writeValueAsString(input));
             
             IncomeModelOutput[] response = restTemplate.postForObject(url, input, IncomeModelOutput[].class);
             
             if (response != null && response.length > 0) {
                 log.info("Income API Response: {}", objectMapper.writeValueAsString(response[0]));
                 return response[0];
             }
        } catch (Exception e) {
            log.error("Failed to call Income API: {}", e.getMessage());
            throw new RuntimeException("ML Model Error", e);
        }
        throw new RuntimeException("Empty response from Income API");
    }

    private RiskModelOutput callRiskApi(RiskModelInput input) {
        String url = riskModelUrl.endsWith("/predict") ? riskModelUrl : riskModelUrl + "/predict";
        try {
            log.info("Calling Risk API at: {}", url);
            log.info("Risk API Request: {}", objectMapper.writeValueAsString(input));

            RiskModelOutput[] response = restTemplate.postForObject(url, input, RiskModelOutput[].class);
            
            if (response != null && response.length > 0) {
                log.info("Risk API Response: {}", objectMapper.writeValueAsString(response[0]));
                return response[0];
            }
        } catch (Exception e) {
            log.error("Failed to call Risk API: {}", e.getMessage());
            throw new RuntimeException("ML Model Error", e);
        }
        throw new RuntimeException("Empty response from Risk API");
    }

    private void determineFinalStatus(LoanApplication app) {
        // Logic:
        // If Risk Score < 40 (Low Risk) AND Income Bucket = Low -> AI_APPROVED
        // Otherwise -> MANUAL_REVIEW for admin to review
        // "class_names = ['No Default', 'Default']". prob of Default.
        // So Higher Probability = Higher Risk.
        // So Risk Score < X is good.
        
        boolean isLowRisk = app.getRiskScore() != null && app.getRiskScore().doubleValue() < 40.0;
        
        boolean isTargetIncome = "Low".equalsIgnoreCase(app.getIncomeBucket()); 
        
        // Calculate Composite Score
        if (app.getRiskScore() != null && app.getIncomeBucket() != null) {
            BigDecimal compositeScore = calculateCompositeScore(app.getRiskScore().doubleValue(), app.getIncomeBucket());
            app.setCreditScoreComposite(String.valueOf(compositeScore.intValue())); // Storing numeric score as string for now in app entity if needed, or mapping later
            
            // ML Model Decision: AI_APPROVED or MANUAL_REVIEW only
            if (isLowRisk && isTargetIncome) {
                app.setStatus("AI_APPROVED");
                app.setAutoSanctionReason("Applicant meets Low Income and Low Risk criteria based on ML scoring.");
            } else {
                app.setStatus("MANUAL_REVIEW");
                app.setAutoSanctionReason("Requires manual review - Risk Score: " + app.getRiskScore() + ", Income: " + app.getIncomeBucket());
            }
        } else {
            // Default to MANUAL_REVIEW if scoring incomplete
            app.setStatus("MANUAL_REVIEW");
            app.setAutoSanctionReason("Incomplete scoring data - requires manual review");
        }
    }

    private BigDecimal calculateCompositeScore(Double riskScore, String incomeBucket) {
        // 1. Risk Component (Normalized 0-1, Inverted so Low Risk = High Score)
        // Formula: 1 - (risk - 12) / (76 - 12)
        // Clamped between 0 and 1
        double risk = Math.max(12, Math.min(76, riskScore));
        double riskComponent = 1.0 - ((risk - 12.0) / (76.0 - 12.0));
        
        // 2. Income Component
        double incomeComponent = 0.3; // Default High Income
        if ("Low".equalsIgnoreCase(incomeBucket)) {
            incomeComponent = 1.0;
        } else if ("Medium".equalsIgnoreCase(incomeBucket)) {
            incomeComponent = 0.6;
        }
        
        // 3. Final Score (Weighted Average -> Scaled to 100)
        // Using 50/50 weights as agreed
        double weightedScore = (riskComponent * 0.5) + (incomeComponent * 0.5);
        double finalScore = weightedScore * 100.0;
        
        return BigDecimal.valueOf(finalScore).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Updates the beneficiary profile with the latest scoring results.
     * This ensures the user's dashboard shows current risk/income assessment.
     */
    private void updateBeneficiaryProfile(BeneficiaryProfile profile, LoanApplication application) {
        try {
            // Extract composite score from application
            if (application.getCreditScoreComposite() != null) {
                BigDecimal compositeScore = new BigDecimal(application.getCreditScoreComposite());
                profile.setCompositeScore(compositeScore);
                profile.setScoreTimestamp(java.time.OffsetDateTime.now());
            }
            
            // Update risk and income buckets
            if (application.getRiskBucket() != null) {
                profile.setRiskBucket(application.getRiskBucket());
            }
            
            if (application.getIncomeBucket() != null) {
                profile.setIncomeBucket(application.getIncomeBucket());
            }
            
            beneficiaryProfileRepository.save(profile);
            log.info("Updated beneficiary profile {} with composite score: {}, risk: {}, income: {}", 
                    profile.getProfileId(), 
                    profile.getCompositeScore(), 
                    profile.getRiskBucket(), 
                    profile.getIncomeBucket());
        } catch (Exception e) {
            log.error("Failed to update beneficiary profile with scoring results", e);
            // Don't throw - scoring should still complete even if profile update fails
        }
    }

    /**
     * Calculates repayment metrics from user's entire loan history.
     * Used to provide accurate data to the Risk ML model.
     */
    private RepaymentMetrics calculateRepaymentMetrics(Long userId) {
        try {
            // Fetch all loans for this user (including historical/closed loans)
            List<com.sih.module.loan.entity.Loan> userLoans = 
                loanRepository.findByUserUserId(userId);
            
            if (userLoans.isEmpty()) {
                // New user with no loan history - return zeros
                return RepaymentMetrics.builder()
                    .totalEmis(0)
                    .paidEmis(0)
                    .latePayments(0)
                    .missedPayments(0)
                    .averageDelayDays(0.0)
                    .build();
            }
            
            int totalEmis = 0;
            int paidEmis = 0;
            int latePayments = 0;
            int missedPayments = 0;
            int totalDelayDays = 0;
            
            for (com.sih.module.loan.entity.Loan loan : userLoans) {
                // Count total EMIs from original tenure
                if (loan.getOriginalTenureMonths() != null) {
                    totalEmis += loan.getOriginalTenureMonths();
                }
                
                // Fetch all repayments for this loan
                List<com.sih.module.loan.entity.Repayment> repayments = 
                    repaymentRepository.findByLoanLoanId(loan.getLoanId());
                
                for (com.sih.module.loan.entity.Repayment r : repayments) {
                    String status = r.getStatus();
                    
                    // Count paid EMIs (completed or fully paid)
                    if (java.util.Set.of("COMPLETED", "PAID").contains(status)) {
                        paidEmis++;
                        
                        // Check if payment was late
                        if (Boolean.FALSE.equals(r.getIsOnTime()) && r.getDelayDays() != null) {
                            latePayments++;
                            totalDelayDays += r.getDelayDays();
                        }
                    } 
                    // Count missed/failed payments
                    else if (java.util.Set.of("FAILED", "DEFAULTED").contains(status)) {
                        missedPayments++;
                    }
                    // Count overdue as missed if beyond grace period (30 days)
                    else if ("OVERDUE".equals(status) && r.getDueDate() != null) {
                        long daysPastDue = java.time.temporal.ChronoUnit.DAYS.between(
                            r.getDueDate(), 
                            java.time.LocalDate.now()
                        );
                        if (daysPastDue > 30) {
                            missedPayments++;
                        }
                    }
                }
            }
            
            // Calculate average delay
            double avgDelay = latePayments > 0 
                ? (double) totalDelayDays / latePayments 
                : 0.0;
            
            RepaymentMetrics metrics = RepaymentMetrics.builder()
                .totalEmis(totalEmis)
                .paidEmis(paidEmis)
                .latePayments(latePayments)
                .missedPayments(missedPayments)
                .averageDelayDays(avgDelay)
                .build();
            
            log.info("Calculated repayment metrics for user {}: Total EMIs={}, Paid={}, Late={}, Missed={}, Avg Delay={} days", 
                    userId, totalEmis, paidEmis, latePayments, missedPayments, avgDelay);
            
            return metrics;
            
        } catch (Exception e) {
            log.error("Failed to calculate repayment metrics for user {}: {}", userId, e.getMessage());
            // Return zeros on error to prevent scoring failure
            return RepaymentMetrics.builder()
                .totalEmis(0)
                .paidEmis(0)
                .latePayments(0)
                .missedPayments(0)
                .averageDelayDays(0.0)
                .build();
        }
    }
}
