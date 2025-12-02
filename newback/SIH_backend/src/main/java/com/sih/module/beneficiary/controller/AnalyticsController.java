package com.sih.module.beneficiary.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.beneficiary.dto.ClusterResponse;
import com.sih.module.beneficiary.dto.DemographicStatsResponse;
import com.sih.module.beneficiary.dto.HeatmapResponse;
import com.sih.module.beneficiary.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/heatmap/state-wise")
    public ResponseEntity<ApiResponse<List<HeatmapResponse>>> getStateWiseHeatmap() {
        List<HeatmapResponse> heatmap = analyticsService.getStateWiseHeatmap();
        return ResponseEntity.ok(ApiResponse.success(heatmap));
    }
    
    @GetMapping("/heatmap/district-wise")
    public ResponseEntity<ApiResponse<List<HeatmapResponse>>> getDistrictWiseHeatmap(
            @RequestParam String state) {
        List<HeatmapResponse> heatmap = analyticsService.getDistrictWiseHeatmap(state);
        return ResponseEntity.ok(ApiResponse.success(heatmap));
    }
    
    @GetMapping("/heatmap/clusters")
    public ResponseEntity<ApiResponse<List<ClusterResponse>>> getRiskClusters() {
        List<ClusterResponse> clusters = analyticsService.getRiskClusters();
        return ResponseEntity.ok(ApiResponse.success(clusters));
    }
    
    @GetMapping("/beneficiaries/stats/demographics")
    public ResponseEntity<ApiResponse<DemographicStatsResponse>> getDemographicStats() {
        DemographicStatsResponse stats = analyticsService.getDemographicStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}

