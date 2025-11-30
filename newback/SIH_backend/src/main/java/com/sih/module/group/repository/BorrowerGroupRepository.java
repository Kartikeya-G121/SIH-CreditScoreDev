package com.sih.module.group.repository;

import com.sih.module.group.entity.BorrowerGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowerGroupRepository extends JpaRepository<BorrowerGroup, Long> {
    List<BorrowerGroup> findByCreatedByUserId(Long userId);
    List<BorrowerGroup> findByIsActive(Boolean isActive);
}

