package com.sih.module.voice.repository;

import com.sih.module.voice.entity.VoiceInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceInteractionRepository extends JpaRepository<VoiceInteraction, Long> {
    List<VoiceInteraction> findByUserUserId(Long userId);
}

