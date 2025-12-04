package com.sih.module.group.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateGroupRequest {
    
    @NotBlank(message = "Group name is required")
    private String groupName;
    
    private LocalDate formationDate;
    
    private String projectDescription;
}

