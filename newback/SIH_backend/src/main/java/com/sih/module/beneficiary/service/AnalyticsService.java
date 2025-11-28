package com.sih.module.beneficiary.service;

import com.sih.module.beneficiary.dto.ClusterResponse;
import com.sih.module.beneficiary.dto.DemographicStatsResponse;
import com.sih.module.beneficiary.dto.HeatmapResponse;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {
    
    private final BeneficiaryProfileRepository profileRepository;
    
    @Cacheable(value = "heatmap", key = "'state-wise'")
    public List<HeatmapResponse> getStateWiseHeatmap() {
        List<Object[]> stats = profileRepository.getStateWiseStats();
        
        return stats.stream().map(stat -> {
            String state = (String) stat[0];
            Long count = ((Number) stat[1]).longValue();
            BigDecimal avgIncome = (BigDecimal) stat[2];
            
            // Calculate risk score (inverse of income - lower income = higher risk)
            BigDecimal riskScore = calculateRiskScore(avgIncome);
            String colorCode = getColorCode(riskScore);
            
            return HeatmapResponse.builder()
                    .region(state)
                    .riskScore(riskScore)
                    .beneficiaryCount(count)
                    .colorCode(colorCode)
                    .averageIncome(avgIncome)
                    .build();
        }).collect(Collectors.toList());
    }
    
    @Cacheable(value = "heatmap", key = "'district-wise-' + #state")
    public List<HeatmapResponse> getDistrictWiseHeatmap(String state) {
        List<Object[]> stats = profileRepository.getDistrictWiseStats(state);
        
        return stats.stream().map(stat -> {
            String district = (String) stat[0];
            Long count = ((Number) stat[1]).longValue();
            BigDecimal avgIncome = (BigDecimal) stat[2];
            
            BigDecimal riskScore = calculateRiskScore(avgIncome);
            String colorCode = getColorCode(riskScore);
            
            return HeatmapResponse.builder()
                    .region(district)
                    .riskScore(riskScore)
                    .beneficiaryCount(count)
                    .colorCode(colorCode)
                    .averageIncome(avgIncome)
                    .build();
        }).collect(Collectors.toList());
    }
    
    public List<ClusterResponse> getRiskClusters() {
        List<BeneficiaryProfile> profiles = profileRepository.findByIsProfileVerified(true);
        
        // Group by pincode
        Map<String, List<BeneficiaryProfile>> byPincode = profiles.stream()
                .filter(p -> p.getPincode() != null)
                .collect(Collectors.groupingBy(BeneficiaryProfile::getPincode));
        
        return byPincode.entrySet().stream()
                .map(entry -> {
                    String pincode = entry.getKey();
                    List<BeneficiaryProfile> clusterProfiles = entry.getValue();
                    
                    if (clusterProfiles.isEmpty()) return null;
                    
                    BeneficiaryProfile first = clusterProfiles.get(0);
                    Long count = (long) clusterProfiles.size();
                    
                    BigDecimal avgIncome = clusterProfiles.stream()
                            .filter(p -> p.getVerifiedAnnualIncome() != null)
                            .map(BeneficiaryProfile::getVerifiedAnnualIncome)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(clusterProfiles.size()), 2, RoundingMode.HALF_UP);
                    
                    BigDecimal riskScore = calculateRiskScore(avgIncome);
                    String riskLevel = getRiskLevel(riskScore);
                    
                    List<BigDecimal> coordinates = new ArrayList<>();
                    if (first.getGeoLat() != null && first.getGeoLong() != null) {
                        coordinates.add(first.getGeoLat());
                        coordinates.add(first.getGeoLong());
                    }
                    
                    return ClusterResponse.builder()
                            .pincode(pincode)
                            .district(first.getDistrict())
                            .state(first.getState())
                            .beneficiaryCount(count)
                            .averageIncome(avgIncome)
                            .riskLevel(riskLevel)
                            .coordinates(coordinates)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    
    public DemographicStatsResponse getDemographicStats() {
        List<BeneficiaryProfile> allProfiles = profileRepository.findAll();
        List<BeneficiaryProfile> verified = profileRepository.findByIsProfileVerified(true);
        
        Map<String, Long> stateWise = allProfiles.stream()
                .filter(p -> p.getState() != null)
                .collect(Collectors.groupingBy(
                    BeneficiaryProfile::getState,
                    Collectors.counting()
                ));
        
        Map<String, Long> casteWise = allProfiles.stream()
                .filter(p -> p.getCasteCategory() != null)
                .collect(Collectors.groupingBy(
                    BeneficiaryProfile::getCasteCategory,
                    Collectors.counting()
                ));
        
        Map<String, Long> genderWise = allProfiles.stream()
                .filter(p -> p.getGender() != null)
                .collect(Collectors.groupingBy(
                    BeneficiaryProfile::getGender,
                    Collectors.counting()
                ));
        
        Map<String, Long> regionWise = allProfiles.stream()
                .filter(p -> p.getRegionType() != null)
                .collect(Collectors.groupingBy(
                    BeneficiaryProfile::getRegionType,
                    Collectors.counting()
                ));
        
        return DemographicStatsResponse.builder()
                .totalBeneficiaries((long) allProfiles.size())
                .verifiedCount((long) verified.size())
                .unverifiedCount((long) (allProfiles.size() - verified.size()))
                .stateWiseDistribution(stateWise)
                .casteCategoryDistribution(casteWise)
                .genderDistribution(genderWise)
                .regionTypeDistribution(regionWise)
                .build();
    }
    
    private BigDecimal calculateRiskScore(BigDecimal avgIncome) {
        if (avgIncome == null || avgIncome.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(100); // High risk
        }
        
        // Normalize: Lower income = Higher risk score (0-100)
        // Assuming income range: 0-500000, risk score = 100 - (income/5000)
        BigDecimal normalized = avgIncome.divide(BigDecimal.valueOf(5000), 2, RoundingMode.HALF_UP);
        BigDecimal riskScore = BigDecimal.valueOf(100).subtract(normalized);
        
        // Clamp between 0 and 100
        if (riskScore.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        if (riskScore.compareTo(BigDecimal.valueOf(100)) > 0) return BigDecimal.valueOf(100);
        
        return riskScore.setScale(2, RoundingMode.HALF_UP);
    }
    
    private String getColorCode(BigDecimal riskScore) {
        if (riskScore.compareTo(BigDecimal.valueOf(70)) >= 0) return "RED";
        if (riskScore.compareTo(BigDecimal.valueOf(40)) >= 0) return "YELLOW";
        return "GREEN";
    }
    
    private String getRiskLevel(BigDecimal riskScore) {
        if (riskScore.compareTo(BigDecimal.valueOf(70)) >= 0) return "HIGH";
        if (riskScore.compareTo(BigDecimal.valueOf(40)) >= 0) return "MEDIUM";
        return "LOW";
    }
}

