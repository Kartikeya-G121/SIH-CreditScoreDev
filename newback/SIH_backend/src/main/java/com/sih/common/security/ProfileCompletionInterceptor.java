package com.sih.common.security;

import com.sih.common.enums.UserRole;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import com.sih.module.partner.repository.LoanOfficerRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileCompletionInterceptor implements HandlerInterceptor {

    private final ChannelPartnerRepository partnerRepository;
    private final LoanOfficerRepository officerRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return true; // Let Security filter handle auth
        }

        if (auth.getPrincipal() instanceof Long) {
            Long userId = (Long) auth.getPrincipal();
            String role = auth.getAuthorities().stream().findFirst().get().getAuthority(); // ROLE_XXX

            String path = request.getRequestURI();
            
            // Allow profile update endpoints
            if (path.contains("/profile") || path.contains("/auth") || path.contains("/public")) {
                return true;
            }

            if ("ROLE_CHANNEL_PARTNER".equals(role)) {
                // Check Partner Profile
                boolean isCompleted = partnerRepository.findByUserUserId(userId)
                        .map(p -> p.getProfile() != null && Boolean.TRUE.equals(p.getProfile().getProfileCompleted()))
                        .orElse(false);

                if (!isCompleted) {
                    log.warn("Blocked request to {} for incomplete partner profile: {}", path, userId);
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Please complete your profile to continue.");
                    return false;
                }
            } else if ("ROLE_LOAN_OFFICER".equals(role)) {
                // Check Officer Profile
                boolean isCompleted = officerRepository.findByUserUserId(userId)
                        .map(o -> o.getProfile() != null && Boolean.TRUE.equals(o.getProfile().getProfileCompleted()))
                        .orElse(false);

                if (!isCompleted) {
                    log.warn("Blocked request to {} for incomplete officer profile: {}", path, userId);
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Please complete your profile to continue.");
                    return false;
                }
            }
        }
        return true;
    }
}
