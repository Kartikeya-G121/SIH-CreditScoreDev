package com.sih.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    
    @NotBlank(message = "Email or phone number is required")
    private String username; // Can be email or phone
    
    @NotBlank(message = "Password is required")
    private String password;
}

