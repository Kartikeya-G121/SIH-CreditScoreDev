package com.sih.module.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartnerRequestDTO {
    
    @NotBlank(message = "Login Gmail is required")
    @Email(message = "Invalid Gmail format")
    private String gmailForLogin;

    @NotBlank(message = "Official Organization Email is required")
    @Email(message = "Invalid Email format")
    private String officialOrganizationEmail;

    @NotBlank(message = "Contact Person Name is required")
    private String contactPersonName;

    private String mobile;

    private String note;
}
