package com.sih.module.partner.entity;

import com.sih.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "partner_account_requests", indexes = {
    @Index(name = "idx_partner_req_status", columnList = "status"),
    @Index(name = "idx_partner_req_gmail", columnList = "gmail_for_login"),
    @Index(name = "idx_partner_req_org_email", columnList = "official_org_email")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerAccountRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long id;

    @Column(name = "gmail_for_login", nullable = false)
    private String gmailForLogin;

    @Column(name = "official_org_email", nullable = false)
    private String officialOrganizationEmail;

    @Column(name = "contact_person_name", nullable = false)
    private String contactPersonName;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED
}
