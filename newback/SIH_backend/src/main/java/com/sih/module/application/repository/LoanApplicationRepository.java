package com.sih.module.application.repository;

import com.sih.module.application.entity.LoanApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByUserUserId(Long userId);

    List<LoanApplication> findByStatus(String status);

    List<LoanApplication> findByGroupGroupId(Long groupId);

    List<LoanApplication> findByGroupGroupIdAndUserUserId(Long groupId, Long userId);

    @Query("SELECT COUNT(la) FROM LoanApplication la JOIN la.scheme s WHERE la.status = :status AND (:providerName IS NULL OR s.providerName = :providerName)")
    long countByStatus(@Param("status") String status, @Param("providerName") String providerName);

    // Analytics methods
    // For Partner Dashboard
    Page<LoanApplication> findBySchemeChannelPartnerId(Long partnerId, Pageable pageable);

    // For Loan Officer Dashboard
    Page<LoanApplication> findBySchemeSchemeIdIn(java.util.Collection<Integer> schemeIds, Pageable pageable);

    // State-wise statistics query
    @Query("SELECT bp.state as state, " +
            "COUNT(la.applicationId) as totalApplications, " +
            "SUM(CASE WHEN la.status = 'SUBMITTED' THEN 1 ELSE 0 END) as submittedCount, " +
            "SUM(CASE WHEN la.status = 'SCORING' THEN 1 ELSE 0 END) as scoringCount, " +
            "SUM(CASE WHEN la.status = 'APPROVED' THEN 1 ELSE 0 END) as approvedCount, " +
            "SUM(CASE WHEN la.status = 'REJECTED' THEN 1 ELSE 0 END) as rejectedCount, " +
            "SUM(CASE WHEN la.status = 'SANCTIONED' THEN 1 ELSE 0 END) as sanctionedCount, " +
            "COALESCE(SUM(la.requestedAmount), 0) as totalAmountRequested " +
            "FROM LoanApplication la " +
            "JOIN la.user u " +
            "JOIN la.scheme s " +
            "JOIN BeneficiaryProfile bp ON bp.user.userId = u.userId " +
            "WHERE bp.state IS NOT NULL " +
            "AND (:providerName IS NULL OR s.providerName = :providerName) " +
            "GROUP BY bp.state")
    List<Object[]> getStateWiseStatistics(@Param("providerName") String providerName);

    // Total count (for total applications stat)
    @Query("SELECT COUNT(la) FROM LoanApplication la JOIN la.scheme s WHERE (:providerName IS NULL OR s.providerName = :providerName)")
    long countAll(@Param("providerName") String providerName);

    /**
     * Advanced search using native SQL for better type handling and performance
     * This is a more reliable alternative to JPQL for complex searches
     */
    @Query(value = """
            SELECT DISTINCT la.*
            FROM loan_applications la
            LEFT JOIN users u ON la.user_id = u.user_id
            LEFT JOIN beneficiary_profiles bp ON u.user_id = bp.user_id
            LEFT JOIN loan_schemes ls ON la.scheme_id = ls.scheme_id
            WHERE (
                COALESCE(CAST(:searchText AS VARCHAR), '') = '' OR
                CAST(la.application_id AS VARCHAR) LIKE CONCAT('%', CAST(:searchText AS VARCHAR), '%') OR
                LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:searchText AS VARCHAR), '%')) OR
                u.phone_number LIKE CONCAT('%', CAST(:searchText AS VARCHAR), '%') OR
                LOWER(bp.full_name) LIKE LOWER(CONCAT('%', CAST(:searchText AS VARCHAR), '%'))
            )
            AND (COALESCE(CAST(:status AS VARCHAR), '') = '' OR la.status = CAST(:status AS VARCHAR))
            AND (COALESCE(CAST(:state AS VARCHAR), '') = '' OR bp.state = CAST(:state AS VARCHAR))
            AND (CAST(:schemeId AS INTEGER) IS NULL OR la.scheme_id = CAST(:schemeId AS INTEGER))
            AND (CAST(:createdAfter AS TIMESTAMP WITH TIME ZONE) IS NULL OR la.created_at >= CAST(:createdAfter AS TIMESTAMP WITH TIME ZONE))
            AND (CAST(:createdBefore AS TIMESTAMP WITH TIME ZONE) IS NULL OR la.created_at <= CAST(:createdBefore AS TIMESTAMP WITH TIME ZONE))
            AND (CAST(:minAmount AS DOUBLE PRECISION) IS NULL OR la.requested_amount >= CAST(:minAmount AS DOUBLE PRECISION))
            AND (CAST(:maxAmount AS DOUBLE PRECISION) IS NULL OR la.requested_amount <= CAST(:maxAmount AS DOUBLE PRECISION))
            AND (COALESCE(CAST(:providerName AS VARCHAR), '') = '' OR LOWER(ls.provider_name) LIKE LOWER(CONCAT('%', CAST(:providerName AS VARCHAR), '%')))
            AND (COALESCE(CAST(:schemeName AS VARCHAR), '') = '' OR LOWER(ls.scheme_name) LIKE LOWER(CONCAT('%', CAST(:schemeName AS VARCHAR), '%')))
            ORDER BY la.created_at DESC
            """, countQuery = """
            SELECT COUNT(DISTINCT la.application_id)
            FROM loan_applications la
            LEFT JOIN users u ON la.user_id = u.user_id
            LEFT JOIN beneficiary_profiles bp ON u.user_id = bp.user_id
            LEFT JOIN loan_schemes ls ON la.scheme_id = ls.scheme_id
            WHERE (
                COALESCE(CAST(:searchText AS VARCHAR), '') = '' OR
                CAST(la.application_id AS VARCHAR) LIKE CONCAT('%', CAST(:searchText AS VARCHAR), '%') OR
                LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:searchText AS VARCHAR), '%')) OR
                u.phone_number LIKE CONCAT('%', CAST(:searchText AS VARCHAR), '%') OR
                LOWER(bp.full_name) LIKE LOWER(CONCAT('%', CAST(:searchText AS VARCHAR), '%'))
            )
            AND (COALESCE(CAST(:status AS VARCHAR), '') = '' OR la.status = CAST(:status AS VARCHAR))
            AND (COALESCE(CAST(:state AS VARCHAR), '') = '' OR bp.state = CAST(:state AS VARCHAR))
            AND (CAST(:schemeId AS INTEGER) IS NULL OR la.scheme_id = CAST(:schemeId AS INTEGER))
            AND (CAST(:createdAfter AS TIMESTAMP WITH TIME ZONE) IS NULL OR la.created_at >= CAST(:createdAfter AS TIMESTAMP WITH TIME ZONE))
            AND (CAST(:createdBefore AS TIMESTAMP WITH TIME ZONE) IS NULL OR la.created_at <= CAST(:createdBefore AS TIMESTAMP WITH TIME ZONE))
            AND (CAST(:minAmount AS DOUBLE PRECISION) IS NULL OR la.requested_amount >= CAST(:minAmount AS DOUBLE PRECISION))
            AND (CAST(:maxAmount AS DOUBLE PRECISION) IS NULL OR la.requested_amount <= CAST(:maxAmount AS DOUBLE PRECISION))
            AND (COALESCE(CAST(:providerName AS VARCHAR), '') = '' OR LOWER(ls.provider_name) LIKE LOWER(CONCAT('%', CAST(:providerName AS VARCHAR), '%')))
            AND (COALESCE(CAST(:schemeName AS VARCHAR), '') = '' OR LOWER(ls.scheme_name) LIKE LOWER(CONCAT('%', CAST(:schemeName AS VARCHAR), '%')))
            """, nativeQuery = true)
    Page<LoanApplication> advancedSearchNative(
            @Param("searchText") String searchText,
            @Param("status") String status,
            @Param("state") String state,
            @Param("schemeId") Integer schemeId,
            @Param("createdAfter") OffsetDateTime createdAfter,
            @Param("createdBefore") OffsetDateTime createdBefore,
            @Param("minAmount") Double minAmount,
            @Param("maxAmount") Double maxAmount,
            @Param("providerName") String providerName,
            @Param("schemeName") String schemeName,
            Pageable pageable);

    /**
     * JPQL-based advanced search (current implementation)
     * Use this if native SQL causes issues with entity mapping
     */
    @Query("""
            SELECT DISTINCT la FROM LoanApplication la
            LEFT JOIN la.user u
            LEFT JOIN BeneficiaryProfile bp ON bp.user.userId = u.userId
            WHERE (
                :searchText IS NULL OR
                CAST(la.applicationId AS string) LIKE CONCAT('%', :searchText, '%') OR
                LOWER(CAST(u.email AS string)) LIKE LOWER(CONCAT('%', :searchText, '%')) OR
                CAST(u.phoneNumber AS string) LIKE CONCAT('%', :searchText, '%') OR
                LOWER(CAST(bp.fullName AS string)) LIKE LOWER(CONCAT('%', :searchText, '%'))
            )
            AND (:status IS NULL OR la.status = :status)
            AND (:state IS NULL OR bp.state = :state)
            AND (:schemeId IS NULL OR la.scheme.schemeId = :schemeId)
            AND (:createdAfter IS NULL OR la.createdAt >= :createdAfter)
            AND (:createdBefore IS NULL OR la.createdAt <= :createdBefore)
            """)
    Page<LoanApplication> advancedSearch(
            @Param("searchText") String searchText,
            @Param("status") String status,
            @Param("state") String state,
            @Param("schemeId") Integer schemeId,
            @Param("createdAfter") OffsetDateTime createdAfter,
            @Param("createdBefore") OffsetDateTime createdBefore,
            Pageable pageable);

}
