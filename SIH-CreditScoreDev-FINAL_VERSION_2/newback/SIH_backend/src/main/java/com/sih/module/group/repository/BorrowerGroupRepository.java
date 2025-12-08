package com.sih.module.group.repository;

import com.sih.module.group.entity.BorrowerGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowerGroupRepository extends JpaRepository<BorrowerGroup, Long> {
    List<BorrowerGroup> findByCreatedByUserId(Long userId);
    List<BorrowerGroup> findByIsActive(Boolean isActive);

    @org.springframework.data.jpa.repository.Query("SELECT g FROM BorrowerGroup g WHERE g.isActive = true AND " +
           "(LOWER(g.groupName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "g.createdBy.userId IN (SELECT p.user.userId FROM BeneficiaryProfile p WHERE LOWER(p.fullName) LIKE LOWER(CONCAT('%', :query, '%'))))")
    List<BorrowerGroup> searchGroups(@org.springframework.data.repository.query.Param("query") String query);
}

