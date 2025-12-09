package com.sih.module.partner.service;

import com.sih.module.beneficiary.dto.BeneficiaryDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@Slf4j
public class CsvParserService {

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy")
    };

    public List<BeneficiaryDataDTO> parseCSVFiles(MultipartFile[] files) throws Exception {
        List<BeneficiaryDataDTO> allData = new ArrayList<>();

        for (MultipartFile file : files) {
            log.info("Parsing CSV file: {}", file.getOriginalFilename());
            allData.addAll(parseCSVFile(file));
        }

        return allData;
    }

    private List<BeneficiaryDataDTO> parseCSVFile(MultipartFile file) throws Exception {
        List<BeneficiaryDataDTO> data = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
                CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim())) {

            Map<String, Integer> headerMap = csvParser.getHeaderMap();
            log.info("CSV Headers: {}", headerMap.keySet());

            // Detect column mappings
            ColumnMapping mapping = detectColumns(headerMap);
            log.info("Column mapping: {}", mapping);

            int rowNumber = 1;
            for (CSVRecord record : csvParser) {
                rowNumber++;
                try {
                    BeneficiaryDataDTO dto = parseRecord(record, mapping);
                    dto.setRowNumber(rowNumber);
                    data.add(dto);
                } catch (Exception e) {
                    log.error("Error parsing row {}: {}", rowNumber, e.getMessage());
                    // Create error DTO to track failed row
                    BeneficiaryDataDTO errorDto = new BeneficiaryDataDTO();
                    errorDto.setRowNumber(rowNumber);
                    data.add(errorDto);
                }
            }
        }

        return data;
    }

    private ColumnMapping detectColumns(Map<String, Integer> headerMap) {
        ColumnMapping mapping = new ColumnMapping();

        for (String header : headerMap.keySet()) {
            String normalized = header.toLowerCase().trim();

            // Email
            if (matches(normalized, "email", "mail", "gmail", "login_email", "e-mail")) {
                mapping.emailColumn = header;
            }
            // Phone
            else if (matches(normalized, "phone", "mobile", "phone_number", "contact", "cell")) {
                mapping.phoneColumn = header;
            }
            // Name
            else if (matches(normalized, "name", "full_name", "fullname", "beneficiary_name")) {
                mapping.nameColumn = header;
            }
            // Gender
            else if (matches(normalized, "gender", "sex")) {
                mapping.genderColumn = header;
            }
            // DOB
            else if (matches(normalized, "dob", "date_of_birth", "birth_date", "birthdate", "dateofbirth")) {
                mapping.dobColumn = header;
            }
            // Caste
            else if (matches(normalized, "caste", "caste_category", "category", "castecategory")) {
                mapping.casteColumn = header;
            }
            // Address
            else if (matches(normalized, "address", "address_line", "permanent_address", "addressline")) {
                mapping.addressColumn = header;
            }
            // State
            else if (matches(normalized, "state", "province")) {
                mapping.stateColumn = header;
            }
            // District
            else if (matches(normalized, "district", "city")) {
                mapping.districtColumn = header;
            }
            // Pincode
            else if (matches(normalized, "pincode", "zip_code", "postal_code", "zip", "zipcode")) {
                mapping.pincodeColumn = header;
            }
            // Region Type
            else if (matches(normalized, "region_type", "region", "area_type", "regiontype")) {
                mapping.regionTypeColumn = header;
            }
            // Income
            else if (matches(normalized, "income", "annual_income", "verified_annual_income", "annualincome")) {
                mapping.incomeColumn = header;
            }
            // Education
            else if (matches(normalized, "education", "qualification", "edu")) {
                mapping.educationColumn = header;
            }
            // Family Size
            else if (matches(normalized, "family_size", "familysize", "family_members")) {
                mapping.familySizeColumn = header;
            }
            // Income Source
            else if (matches(normalized, "income_source", "incomesource", "occupation")) {
                mapping.incomeSourceColumn = header;
            }
        }

        return mapping;
    }

    private boolean matches(String value, String... patterns) {
        for (String pattern : patterns) {
            if (value.equals(pattern) || value.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private BeneficiaryDataDTO parseRecord(CSVRecord record, ColumnMapping mapping) {
        BeneficiaryDataDTO dto = new BeneficiaryDataDTO();

        // User fields (REQUIRED)
        dto.setEmail(getStringValue(record, mapping.emailColumn));
        dto.setPhone(getStringValue(record, mapping.phoneColumn));

        // Profile fields (optional)
        dto.setFullName(getStringValue(record, mapping.nameColumn));
        dto.setGender(getStringValue(record, mapping.genderColumn));
        dto.setCasteCategory(getStringValue(record, mapping.casteColumn));
        dto.setDob(getDateValue(record, mapping.dobColumn));

        // Location
        dto.setAddressLine(getStringValue(record, mapping.addressColumn));
        dto.setState(getStringValue(record, mapping.stateColumn));
        dto.setDistrict(getStringValue(record, mapping.districtColumn));
        dto.setPincode(getStringValue(record, mapping.pincodeColumn));
        dto.setRegionType(getStringValue(record, mapping.regionTypeColumn));

        // Financial
        dto.setVerifiedAnnualIncome(getBigDecimalValue(record, mapping.incomeColumn));
        dto.setEducation(getStringValue(record, mapping.educationColumn));
        dto.setFamilySize(getIntegerValue(record, mapping.familySizeColumn));
        dto.setIncomeSource(getStringValue(record, mapping.incomeSourceColumn));

        return dto;
    }

    private String getStringValue(CSVRecord record, String column) {
        if (column == null)
            return null;
        try {
            String value = record.get(column);
            return (value == null || value.trim().isEmpty()) ? null : value.trim();
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate getDateValue(CSVRecord record, String column) {
        String value = getStringValue(record, column);
        if (value == null)
            return null;

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(value, formatter);
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }

        log.warn("Could not parse date: {}", value);
        return null;
    }

    private BigDecimal getBigDecimalValue(CSVRecord record, String column) {
        String value = getStringValue(record, column);
        if (value == null)
            return null;

        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            log.warn("Could not parse decimal: {}", value);
            return null;
        }
    }

    private Integer getIntegerValue(CSVRecord record, String column) {
        String value = getStringValue(record, column);
        if (value == null)
            return null;

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.warn("Could not parse integer: {}", value);
            return null;
        }
    }

    @lombok.Data
    @lombok.ToString
    private static class ColumnMapping {
        String emailColumn;
        String phoneColumn;
        String nameColumn;
        String genderColumn;
        String dobColumn;
        String casteColumn;
        String addressColumn;
        String stateColumn;
        String districtColumn;
        String pincodeColumn;
        String regionTypeColumn;
        String incomeColumn;
        String educationColumn;
        String familySizeColumn;
        String incomeSourceColumn;
    }
}
