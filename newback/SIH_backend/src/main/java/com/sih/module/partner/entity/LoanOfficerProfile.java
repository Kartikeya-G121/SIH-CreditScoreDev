package com.sih.module.partner.entity;

import com.sih.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "loan_officer_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanOfficerProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "officer_id", nullable = false, unique = true)
    private LoanOfficer loanOfficer;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;

    @Column(name = "designation")
    private String designation; // Loan Officer, Field Agent, etc.

    @Column(name = "employee_id")
    private String employeeId;

    @Column(name = "office_location")
    private String officeLocation;

    @Column(name = "profile_photo_url")
    private String profilePhoto;

    @Column(name = "id_card_pdf_url")
    private String idCardPdf;

    @Column(name = "profile_completed", nullable = false)
    @Builder.Default
    private Boolean profileCompleted = false;
}
