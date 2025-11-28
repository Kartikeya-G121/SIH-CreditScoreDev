package com.sih.module.consumption.service;

import com.sih.common.config.FailSafeConfig;
import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.consumption.dto.*;
import com.sih.module.consumption.entity.ConsumptionEntry;
import com.sih.module.consumption.repository.ConsumptionEntryRepository;
import com.sih.module.beneficiary.service.SupabaseStorageService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.scheduling.annotation.Async;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsumptionService {

    private final ConsumptionEntryRepository entryRepository;
    private final UserRepository userRepository;
    private final FailSafeConfig failSafeConfig;
    private final SupabaseStorageService supabaseStorageService;
    private final OcrService ocrService;
    private final BbpsService bbpsService;

    public List<ConsumptionEntryResponse> uploadBatch(Long userId, MultipartFile[] files, String dataSource) {
        List<ConsumptionEntryResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                ConsumptionEntryRequest request = new ConsumptionEntryRequest();
                request.setDataSource(dataSource);
                responses.add(uploadEntry(userId, request, file.getBytes(), file.getOriginalFilename()));
            } catch (Exception e) {
                log.error("Failed to upload file in batch: {}", file.getOriginalFilename(), e);
                // We continue processing other files even if one fails
            }
        }
        return responses;
    }

    @Transactional
    public ConsumptionEntryResponse uploadEntry(Long userId, ConsumptionEntryRequest request, byte[] fileData,
            String originalFilename) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Upload to Supabase
        String fileUrl = supabaseStorageService.uploadFile(fileData,
                originalFilename != null ? originalFilename : "bill.pdf", "consumption");

        // Generate document hash for duplicate detection
        String documentHash = generateHash(fileData != null ? fileData : request.toString().getBytes());

        // Check for duplicates
        // if (entryRepository.findByUserUserId(userId).stream()
        // .anyMatch(e -> documentHash.equals(e.getDocumentHash()))) {
        // throw new BadRequestException("Duplicate entry detected");
        // }

        ConsumptionEntry entry = ConsumptionEntry.builder()
                .user(user)
                .dataSource(request.getDataSource())
                .billingAmount(null) // Will be populated by OCR
                .billingDate(null) // Will be populated by OCR
                .unitsConsumed(null) // Will be populated by OCR
                .documentHash(documentHash)
                .verificationStatus("PENDING")
                .isTamperedFlag(false)
                .isImputed(false)
                .fileS3Url(fileUrl)
                .storageType("SUPABASE")
                .build();

        entry = entryRepository.save(entry);
        log.info("Consumption entry created: {} for user: {}", entry.getEntryId(), userId);

        // Trigger Async Verification
        processBillVerification(entry.getEntryId(), fileUrl);

        return mapToResponse(entry);
    }

    @Async
    @Transactional
    public void processBillVerification(Long entryId, String fileUrl) {
        log.info("Starting async verification for entry: {}", entryId);
        try {
            ConsumptionEntry entry = entryRepository.findById(entryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

            // 1. OCR Parsing
            OcrService.ParsedBillDetails parsedDetails = ocrService.parseBill(fileUrl);
            log.info("OCR parsing completed for entry: {}", entryId);

            // Update entry with parsed details
            if (parsedDetails.getAmount() != null) {
                entry.setBillingAmount(parsedDetails.getAmount());
            }
            if (parsedDetails.getDate() != null) {
                entry.setBillingDate(parsedDetails.getDate());
            }
            if (parsedDetails.getUnitsConsumed() != null) {
                entry.setUnitsConsumed(parsedDetails.getUnitsConsumed());
            }

            // Store OCR extracted fields
            entry.setBillerName(parsedDetails.getBillerName());
            entry.setBillNumber(parsedDetails.getBillNumber());
            entry.setConsumerNumber(parsedDetails.getConsumerNumber());
            entry.setBillerCategory(parsedDetails.getBillerCategory());
            entry.setDueDate(parsedDetails.getDueDate());
            entry.setOcrConfidence(parsedDetails.getOverallConfidence());
            entry.setOcrRawData(parsedDetails.getRawData());

            entry = entryRepository.save(entry);
            log.info("OCR data saved for entry: {}", entryId);

            // 2. BBPS Verification
            com.sih.module.consumption.dto.BbpsVerificationResponse bbpsResponse = bbpsService
                    .verifyBill(parsedDetails);
            log.info("BBPS verification completed for entry: {}, verified: {}, tampered: {}",
                    entryId, bbpsResponse.isVerified(), bbpsResponse.isTampered());

            // Update verification status
            if (bbpsResponse.isVerified()) {
                entry.setVerificationStatus("VERIFIED");
                entry.setVerificationSource(bbpsResponse.getVerificationSource());
                entry.setVerificationConfidence(bbpsResponse.getConfidence());
                entry.setIsTamperedFlag(false);
            } else if (bbpsResponse.isTampered()) {
                entry.setVerificationStatus("REJECTED");
                entry.setVerificationSource(bbpsResponse.getVerificationSource());
                entry.setVerificationConfidence(bbpsResponse.getConfidence());
                entry.setIsTamperedFlag(true);
                entry.setTamperReason(String.join("; ", bbpsResponse.getTamperReasons()));
            } else {
                entry.setVerificationStatus("PENDING"); // Fallback to manual
                entry.setVerificationSource("BBPS_FAILED");
                entry.setVerificationConfidence(bbpsResponse.getConfidence());
            }

            // Store BBPS response
            Map<String, Object> bbpsResponseMap = new HashMap<>();
            bbpsResponseMap.put("verified", bbpsResponse.isVerified());
            bbpsResponseMap.put("tampered", bbpsResponse.isTampered());
            bbpsResponseMap.put("tamperReasons", bbpsResponse.getTamperReasons());
            bbpsResponseMap.put("confidence", bbpsResponse.getConfidence());
            bbpsResponseMap.put("message", bbpsResponse.getMessage());
            entry.setBbpsResponse(bbpsResponseMap);

            entryRepository.save(entry);
            log.info("Verification completed for entry: {}, Status: {}", entryId, entry.getVerificationStatus());

        } catch (Exception e) {
            log.error("Error during async verification for entry: {}", entryId, e);
            // Update entry status to indicate error
            try {
                ConsumptionEntry entry = entryRepository.findById(entryId).orElse(null);
                if (entry != null) {
                    entry.setVerificationStatus("ERROR");
                    entry.setVerificationSource("SYSTEM");
                    entry.setTamperReason("Verification failed: " + e.getMessage());
                    entryRepository.save(entry);
                }
            } catch (Exception ex) {
                log.error("Failed to update entry status after error", ex);
            }
        }
    }

    @Transactional
    public List<ConsumptionEntryResponse> syncOfflineData(Long userId, OfflineBatchRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<ConsumptionEntryResponse> responses = new ArrayList<>();
        Set<String> processedHashes = new HashSet<>();

        for (ConsumptionEntryRequest entryRequest : request.getEntries()) {
            // Check for duplicates in batch
            String hash = generateHash(entryRequest.toString().getBytes());
            if (processedHashes.contains(hash)) {
                log.warn("Duplicate entry in batch, skipping");
                continue;
            }

            // Check for duplicates in database
            if (entryRepository.findByUserUserId(userId).stream()
                    .anyMatch(e -> hash.equals(e.getDocumentHash()))) {
                log.warn("Entry already exists in database, skipping");
                continue;
            }

            ConsumptionEntry entry = ConsumptionEntry.builder()
                    .user(user)
                    .dataSource(entryRequest.getDataSource())
                    .billingAmount(entryRequest.getBillingAmount())
                    .billingDate(entryRequest.getBillingDate())
                    .unitsConsumed(entryRequest.getUnitsConsumed())
                    .documentHash(hash)
                    .verificationStatus("PENDING")
                    .isImputed(true) // Mark as imputed for offline data
                    .isTamperedFlag(false)
                    .build();

            entry = entryRepository.save(entry);
            processedHashes.add(hash);
            responses.add(mapToResponse(entry));
        }

        log.info("Offline sync completed: {} entries processed for user: {}", responses.size(), userId);
        return responses;
    }

    public List<ConsumptionEntryResponse> getMyEntries(Long userId) {
        return entryRepository.findByUserUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ConsumptionEntryResponse getEntryById(Long entryId) {
        ConsumptionEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));
        return mapToResponse(entry);
    }

    @Transactional
    public void deleteEntry(Long entryId, Long userId) {
        ConsumptionEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

        if (!entry.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only delete your own entries");
        }

        entryRepository.delete(entry);
        log.info("Entry deleted: {}", entryId);
    }

    public ConsumptionSummaryResponse getSummary(Long userId) {
        List<ConsumptionEntry> entries = entryRepository.findByUserUserId(userId);

        long total = entries.size();
        long verified = entries.stream()
                .filter(e -> "VERIFIED".equals(e.getVerificationStatus()))
                .count();
        long pending = entries.stream()
                .filter(e -> "PENDING".equals(e.getVerificationStatus()))
                .count();

        BigDecimal totalAmount = entries.stream()
                .filter(e -> e.getBillingAmount() != null)
                .map(ConsumptionEntry::getBillingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgAmount = total > 0 ? totalAmount.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Long> bySource = entries.stream()
                .collect(Collectors.groupingBy(
                        ConsumptionEntry::getDataSource,
                        Collectors.counting()));

        Map<String, BigDecimal> amountBySource = entries.stream()
                .filter(e -> e.getBillingAmount() != null)
                .collect(Collectors.groupingBy(
                        ConsumptionEntry::getDataSource,
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                ConsumptionEntry::getBillingAmount,
                                BigDecimal::add)));

        return ConsumptionSummaryResponse.builder()
                .totalEntries(total)
                .verifiedEntries(verified)
                .pendingEntries(pending)
                .totalAmount(totalAmount)
                .averageAmount(avgAmount)
                .entriesBySource(bySource)
                .amountBySource(amountBySource)
                .build();
    }

    @Transactional
    public ConsumptionEntryResponse verifyEntry(Long entryId, Long officerId, boolean verified) {
        ConsumptionEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found"));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));

        entry.setVerificationStatus(verified ? "VERIFIED" : "REJECTED");
        entry.setVerificationSource("MANUAL");
        entry.setVerificationConfidence(BigDecimal.valueOf(100));
        entry.setVerifiedBy(officer);

        entry = entryRepository.save(entry);
        log.info("Entry {} verified: {} by officer: {}", entryId, verified, officerId);

        return mapToResponse(entry);
    }

    public List<ConsumptionEntryResponse> searchEntries(Long userId, String dataSource, String status) {
        return entryRepository.searchEntries(userId, dataSource, status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String generateHash(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data);
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private ConsumptionEntryResponse mapToResponse(ConsumptionEntry entry) {
        return ConsumptionEntryResponse.builder()
                .entryId(entry.getEntryId())
                .userId(entry.getUser().getUserId())
                .dataSource(entry.getDataSource())
                .billingAmount(entry.getBillingAmount())
                .billingDate(entry.getBillingDate())
                .unitsConsumed(entry.getUnitsConsumed())
                .uploadMetadata(entry.getUploadMetadata())
                .isTamperedFlag(entry.getIsTamperedFlag())
                .tamperReason(entry.getTamperReason())
                .isImputed(entry.getIsImputed())
                .verificationStatus(entry.getVerificationStatus())
                .verificationSource(entry.getVerificationSource())
                .verificationConfidence(entry.getVerificationConfidence())
                .verifiedBy(entry.getVerifiedBy() != null ? entry.getVerifiedBy().getUserId() : null)
                .fileS3Url(entry.getFileS3Url())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
