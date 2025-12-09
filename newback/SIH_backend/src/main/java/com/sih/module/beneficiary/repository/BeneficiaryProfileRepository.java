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
       Optional<BeneficiaryProfile> findByUser(com.sih.module.auth.entity.User user);

       Optional<BeneficiaryProfile> findByUserUserId(Long userId);

       List<BeneficiaryProfile> findByUserUserIdIn(List<Long> userIds);

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
                     @Param("pincode") String pincode);

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

       // Custom query for user search filtering - using UPPER for case-insensitive
       // comparison
       @Query("SELECT b.user.userId FROM BeneficiaryProfile b WHERE " +
                     "(:regionType IS NULL OR :regionType = '' OR UPPER(b.regionType) = UPPER(:regionType)) AND " +
                     "(:state IS NULL OR :state = '' OR UPPER(b.state) = UPPER(:state)) AND " +
                     "(:district IS NULL OR :district = '' OR UPPER(b.district) = UPPER(:district)) AND " +
                     "(:casteCategory IS NULL OR :casteCategory = '' OR UPPER(b.casteCategory) = UPPER(:casteCategory)) AND "
                     +
                     "(:gender IS NULL OR :gender = '' OR UPPER(b.gender) = UPPER(:gender))")
       List<Long> findUserIdsByProfileCriteria(
                     @Param("regionType") String regionType,
                     @Param("state") String state,
                     @Param("district") String district,
                     @Param("casteCategory") String casteCategory,
                     @Param("gender") String gender);
}
