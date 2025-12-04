package com.sih.module.scoring.repository;

import com.sih.module.scoring.entity.MLModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MLModelRepository extends JpaRepository<MLModel, Long> {
    List<MLModel> findByIsActive(Boolean isActive);
    Optional<MLModel> findByIsActiveTrue();
}

