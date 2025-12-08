package com.sih.module.partner.entity;

import com.sih.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "channel_partner_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelPartnerProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false, unique = true)
    private ChannelPartner channelPartner;

    @Column(name = "organization_type", nullable = false)
    private String organizationType; // NGO, Society, etc.

    @Column(name = "registered_address")
    private String registeredAddress;

    @Column(name = "state")
    private String state;

    @Column(name = "district")
    private String district;

    @Column(name = "pincode")
    private String pincode;

    @Column(name = "contact_person_name")
    private String contactPersonName;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "organization_website")
    private String organizationWebsite;

    @Column(name = "support_email")
    private String supportEmail;

    // Documents
    @Column(name = "organization_logo")
    private String organizationLogo;

    @Column(name = "registration_cert_pdf")
    private String registrationCertificatePdf;

    @Column(name = "gst_pan_pdf")
    private String gstOrPanPdf;

    @Column(name = "profile_completed", nullable = false)
    @Builder.Default
    private Boolean profileCompleted = false;
}
