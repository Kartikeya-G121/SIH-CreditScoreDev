package com.sih.module.notification.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.notification.entity.Notification;
import com.sih.module.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Boolean isRead) {
        List<Notification> notifications = notificationService.getMyNotifications(userId, isRead);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Object>> markAllAsRead(@AuthenticationPrincipal Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
}

