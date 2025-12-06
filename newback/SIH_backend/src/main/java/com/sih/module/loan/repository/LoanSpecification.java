package com.sih.module.loan.repository;

import com.sih.module.loan.dto.LoanSearchCriteria;
import com.sih.module.loan.entity.Loan;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.auth.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Predicate;

public class LoanSpecification {

    public static Specification<Loan> getSpecification(LoanSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Join Application for Search by Application ID (if query matches)
            // Join User and BeneficiaryProfile for Name/State search

            if (StringUtils.hasText(criteria.getQuery())) {
                String q = criteria.getQuery().toLowerCase();
                Join<Loan, User> userJoin = root.join("user", JoinType.LEFT);
                Join<User, BeneficiaryProfile> profileJoin = userJoin.join("beneficiaryProfile", JoinType.LEFT);

                Predicate namePredicate = cb.like(cb.lower(profileJoin.get("fullName")), "%" + q + "%");
                Predicate appIdPredicate = cb.like(cb.lower(root.get("application").get("applicationId").as(String.class)), "%" + q + "%");
                
                predicates.add(cb.or(namePredicate, appIdPredicate));
            }

            if (StringUtils.hasText(criteria.getStatus())) {
                predicates.add(cb.equal(root.get("loanStatus"), criteria.getStatus()));
            }

            if (StringUtils.hasText(criteria.getRiskBucket())) {
                predicates.add(cb.equal(root.get("riskBucket"), criteria.getRiskBucket()));
            }

            if (criteria.getIsNpa() != null && criteria.getIsNpa()) {
                predicates.add(cb.equal(root.get("riskBucket"), "NPA"));
            }

            if (StringUtils.hasText(criteria.getState())) {
                Join<Loan, User> userJoin = root.join("user", JoinType.INNER);
                Join<User, BeneficiaryProfile> profileJoin = userJoin.join("beneficiaryProfile", JoinType.INNER);
                predicates.add(cb.equal(profileJoin.get("state"), criteria.getState()));
            }

            if (criteria.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalPrincipal"), criteria.getMinAmount()));
            }

            if (criteria.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalPrincipal"), criteria.getMaxAmount()));
            }
            
            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startDate"), criteria.getStartDate()));
            }

            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), criteria.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
