package com.sih.config;

import com.sih.common.security.ProfileCompletionInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final ProfileCompletionInterceptor profileCompletionInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(profileCompletionInterceptor)
                .addPathPatterns("/api/v1/partner/**", "/api/v1/officer/**")
                .excludePathPatterns(
                        "/api/v1/partner/profile/**", 
                        "/api/v1/officer/profile/**"
                );
    }
}
