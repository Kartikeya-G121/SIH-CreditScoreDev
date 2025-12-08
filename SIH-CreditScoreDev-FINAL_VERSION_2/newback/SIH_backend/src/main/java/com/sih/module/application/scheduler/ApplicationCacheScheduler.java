package com.sih.module.application.scheduler;

import com.sih.module.application.service.ApplicationAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationCacheScheduler {

    private final ApplicationAnalyticsService analyticsService;

    /**
     * Scheduled task to refresh application analytics cache
     * Runs at midnight (00:00) every 2 days
     * Cron: second minute hour day month weekday
     */
    @Scheduled(cron = "0 0 0 */2 * ?")
    public void refreshApplicationAnalyticsCache() {
        log.info("Scheduled cache refresh started for application analytics");
        try {
            analyticsService.refreshAnalyticsCache();
            // Trigger cache reload
            analyticsService.getApplicationAnalytics();
            log.info("Scheduled cache refresh completed successfully");
        } catch (Exception e) {
            log.error("Error during scheduled cache refresh: {}", e.getMessage(), e);
        }
    }
}
