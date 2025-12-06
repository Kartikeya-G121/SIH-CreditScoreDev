package com.sih.module.loan.repository;

import com.sih.module.loan.entity.Loan;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long>, JpaSpecificationExecutor<Loan> {
    List<Loan> findByUserUserId(Long userId);

    List<Loan> findByLoanStatus(String status);

    boolean existsByUserUserIdAndLoanStatus(Long userId, String status);

    List<Loan> findByNextPaymentDateBeforeAndLoanStatus(java.time.LocalDate date, String status);

    boolean existsByGroupGroupIdAndLoanStatus(Long groupId, String loanStatus);

    // New methods for Loan Servicing
    boolean existsByApplicationApplicationId(Long applicationId);

    Optional<Loan> findByApplicationApplicationId(Long applicationId);

    @Query("SELECT l FROM Loan l WHERE l.user.userId = :userId AND l.loanStatus IN ('ACTIVE', 'OVERDUE')")
    List<Loan> findActiveLoansByUserId(@Param("userId") Long userId);

    // --- Analytics Queries ---

    @Query("SELECT SUM(l.outstandingPrincipal) FROM Loan l WHERE l.loanStatus IN ('ACTIVE', 'OVERDUE', 'DEFAULTED')")
    BigDecimal getTotalAum();

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.loanStatus = 'ACTIVE'")
    Long countActiveLoans();

    @Query("SELECT SUM(l.outstandingPrincipal) FROM Loan l WHERE l.riskBucket = 'NPA'")
    BigDecimal getTotalNpaAmount();

    @Query("SELECT SUM(l.outstandingPrincipal) FROM Loan l WHERE l.dpd > 30 AND l.loanStatus IN ('ACTIVE', 'OVERDUE', 'DEFAULTED')")
    BigDecimal getTotalParAmount();

    // Risk Bucket Distribution
    // Returns: [riskBucket, count, totalPrincipal]
    @Query("SELECT l.riskBucket, COUNT(l), SUM(l.outstandingPrincipal) " +
           "FROM Loan l " +
           "WHERE l.loanStatus IN ('ACTIVE', 'OVERDUE', 'DEFAULTED') " +
           "GROUP BY l.riskBucket")
    List<Object[]> getRiskBucketDistribution();

    // State-wise Performance
    // Returns: [state, count, totalAum, npaAmount]
    // Note: npaAmount calculation requires conditional sum, using logic: SUM(CASE WHEN riskBucket='NPA' THEN outstandingPrincipal ELSE 0 END)
    @Query(value = "SELECT bp.state, " +
            "COUNT(l.loan_id) as loan_count, " +
            "SUM(l.outstanding_principal) as total_aum, " +
            "SUM(CASE WHEN l.risk_bucket = 'NPA' THEN l.outstanding_principal ELSE 0 END) as npa_amount " +
            "FROM loans l " +
            "JOIN beneficiary_profiles bp ON l.user_id = bp.user_id " +
            "WHERE l.loan_status IN ('ACTIVE', 'OVERDUE', 'DEFAULTED') " +
            "GROUP BY bp.state", nativeQuery = true)
    List<Object[]> getStateWisePerformance();

    // Scheme-wise Performance
    // Returns: [schemeId, schemeName, isActive, count, totalAum, npaAmount, avgRoi]
    @Query(value = "SELECT s.scheme_id, s.scheme_name, s.is_active, " +
            "COUNT(l.loan_id) as loan_count, " +
            "SUM(l.outstanding_principal) as total_aum, " +
            "SUM(CASE WHEN l.risk_bucket = 'NPA' THEN l.outstanding_principal ELSE 0 END) as npa_amount, " +
            "AVG(l.interest_rate) as avg_roi " +
            "FROM loans l " +
            "JOIN loan_applications la ON l.application_id = la.application_id " +
            "JOIN loan_schemes s ON la.scheme_id = s.scheme_id " +
            "WHERE l.loan_status IN ('ACTIVE', 'OVERDUE', 'DEFAULTED') " +
            "GROUP BY s.scheme_id, s.scheme_name, s.is_active", nativeQuery = true)
    List<Object[]> getSchemeWisePerformance();
    // Provider Performance
    // Returns: [providerName, totalSchemes, activeLoans, totalAum, npaRate, avgRoi]
    @Query(value = "SELECT s.provider_name, " +
            "COUNT(DISTINCT s.scheme_id) as total_schemes, " +
            "COUNT(l.loan_id) as active_loans, " +
            "SUM(l.outstanding_principal) as total_aum, " +
            "SUM(CASE WHEN l.risk_bucket = 'NPA' THEN l.outstanding_principal ELSE 0 END) as npa_amount, " +
            "AVG(l.interest_rate) as avg_roi " +
            "FROM loans l " +
            "JOIN loan_applications la ON l.application_id = la.application_id " +
            "JOIN loan_schemes s ON la.scheme_id = s.scheme_id " +
            "WHERE l.loan_status IN ('ACTIVE', 'OVERDUE', 'DEFAULTED') " +
            "GROUP BY s.provider_name", nativeQuery = true)
    List<Object[]> getProviderPerformance();

    // User Demographics - Gender
    // Returns: [gender, count, percentage]
    @Query(value = "SELECT bp.gender, COUNT(bp.profile_id) " +
            "FROM beneficiary_profiles bp " +
            "JOIN loans l ON bp.user_id = l.user_id " +
            "WHERE l.loan_status IN ('ACTIVE', 'OVERDUE') " +
            "GROUP BY bp.gender", nativeQuery = true)
    List<Object[]> getBorrowerGenderDistribution();

    // User Demographics - Age Group (Derived from DOB)
    // Returns: [age_group, count]
    @Query(value = "SELECT " +
            "CASE " +
            "  WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, bp.dob)) < 25 THEN '18-25' " +
            "  WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, bp.dob)) BETWEEN 25 AND 35 THEN '26-35' " +
            "  WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, bp.dob)) BETWEEN 36 AND 50 THEN '36-50' " +
            "  ELSE '50+' " +
            "END as age_group, " +
            "COUNT(bp.profile_id) " +
            "FROM beneficiary_profiles bp " +
            "JOIN loans l ON bp.user_id = l.user_id " +
            "WHERE l.loan_status IN ('ACTIVE', 'OVERDUE') " +
            "GROUP BY " +
            "CASE " +
            "  WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, bp.dob)) < 25 THEN '18-25' " +
            "  WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, bp.dob)) BETWEEN 25 AND 35 THEN '26-35' " +
            "  WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, bp.dob)) BETWEEN 36 AND 50 THEN '36-50' " +
            "  ELSE '50+' " +
            "END", nativeQuery = true)
    List<Object[]> getBorrowerAgeDistribution();
}
