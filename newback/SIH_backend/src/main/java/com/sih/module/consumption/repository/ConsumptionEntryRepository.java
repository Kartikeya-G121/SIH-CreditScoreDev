package com.sih.module.consumption.repository;

import com.sih.module.consumption.entity.ConsumptionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ConsumptionEntryRepository extends JpaRepository<ConsumptionEntry, Long> {
    List<ConsumptionEntry> findByUserUserId(Long userId);
    List<ConsumptionEntry> findByUserUserIdAndBillingDateBetween(
            Long userId, LocalDate startDate, LocalDate endDate);
    List<ConsumptionEntry> findByVerificationStatus(String status);
    List<ConsumptionEntry> findByDataSource(String dataSource);
    List<ConsumptionEntry> findByIsTamperedFlag(Boolean isTampered);
    
    @Query("SELECT c FROM ConsumptionEntry c WHERE " +
           "(:userId IS NULL OR c.user.userId = :userId) AND " +
           "(:dataSource IS NULL OR c.dataSource = :dataSource) AND " +
           "(:status IS NULL OR c.verificationStatus = :status)")
    List<ConsumptionEntry> searchEntries(
        @Param("userId") Long userId,
        @Param("dataSource") String dataSource,
        @Param("status") String status
    );
}

