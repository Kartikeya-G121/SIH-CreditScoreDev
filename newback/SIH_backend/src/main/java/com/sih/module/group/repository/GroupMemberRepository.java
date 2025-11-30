package com.sih.module.group.repository;

import com.sih.module.group.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupGroupId(Long groupId);
    List<GroupMember> findByUserUserId(Long userId);
    Optional<GroupMember> findByGroupGroupIdAndUserUserId(Long groupId, Long userId);
    List<GroupMember> findByGroupGroupIdAndStatus(Long groupId, String status);
}

