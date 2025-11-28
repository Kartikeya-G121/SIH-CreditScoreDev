package com.sih.module.group.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {
    private Long memberId;
    private Long userId;
    private String email;
    private String phoneNumber;
    private String role;
    private String status;
    private LocalDate joinedAt;
}

