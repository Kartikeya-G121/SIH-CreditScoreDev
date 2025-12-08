package com.sih.module.partner.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.module.auth.entity.User;
import com.sih.module.scheme.entity.LoanScheme;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "channel_partners", indexes = {
    @Index(name = "idx_partner_user", columnList = "user_id"),
    @Index(name = "idx_partner_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelPartner extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "partner_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "organization_email", nullable = false)
    private String organizationEmail;

    // Read-only login email mirrored from User, for easy query
    @Column(name = "login_email", nullable = false)
    private String loginEmail;

    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_by_admin_id")
    private Long createdByAdminId;

    @OneToMany(mappedBy = "channelPartner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LoanScheme> loanSchemes = new ArrayList<>();
    
    @OneToOne(mappedBy = "channelPartner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ChannelPartnerProfile profile;
}
