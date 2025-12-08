package com.sih.module.partner.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "loan_officers", indexes = {
    @Index(name = "idx_officer_user", columnList = "user_id"),
    @Index(name = "idx_officer_partner", columnList = "partner_id"),
    @Index(name = "idx_officer_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanOfficer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "officer_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private ChannelPartner channelPartner;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ElementCollection
    @CollectionTable(name = "officer_assigned_schemes", joinColumns = @JoinColumn(name = "officer_id"))
    @Column(name = "scheme_id")
    @Builder.Default
    private Set<Integer> assignedSchemeIds = new HashSet<>();

    @OneToOne(mappedBy = "loanOfficer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private LoanOfficerProfile profile;
}
