package com.sih.module.beneficiary.repository;

import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiaryProfileRepository extends JpaRepository<BeneficiaryProfile, Long> {
    Optional<BeneficiaryProfile> findByUserUserId(Long userId);
    List<BeneficiaryProfile> findByState(String state);
    List<BeneficiaryProfile> findByStateAndDistrict(String state, String district);
    List<BeneficiaryProfile> findByIsProfileVerified(Boolean isVerified);
    
    @Query("SELECT b FROM BeneficiaryProfile b WHERE " +
           "(:state IS NULL OR b.state = :state) AND " +
           "(:district IS NULL OR b.district = :district) AND " +
           "(:pincode IS NULL OR b.pincode = :pincode)")
    List<BeneficiaryProfile> searchProfiles(
        @Param("state") String state,
        @Param("district") String district,
        @Param("pincode") String pincode
    );
    
    @Query("SELECT b.state, COUNT(b), AVG(b.verifiedAnnualIncome) " +
           "FROM BeneficiaryProfile b " +
           "WHERE b.isProfileVerified = true " +
           "GROUP BY b.state")
    List<Object[]> getStateWiseStats();
    
    @Query("SELECT b.district, COUNT(b), AVG(b.verifiedAnnualIncome) " +
           "FROM BeneficiaryProfile b " +
           "WHERE b.isProfileVerified = true AND b.state = :state " +
           "GROUP BY b.district")
    List<Object[]> getDistrictWiseStats(@Param("state") String state);
}

