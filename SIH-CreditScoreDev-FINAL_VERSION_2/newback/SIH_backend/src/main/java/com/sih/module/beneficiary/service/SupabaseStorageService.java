package com.sih.module.beneficiary.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.s3.access-key}") // Using this as the API Key (Service Role or Anon)
    private String apiKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void init() {
        log.info("Supabase Storage Service initialized with REST API. URL: {}", supabaseUrl);
    }

    public String uploadFile(byte[] data, String originalFileName, String folder) {
        String fileName = folder + "/" + UUID.randomUUID() + "_" + originalFileName;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("apikey", apiKey); // Some endpoints require this header too

            // Determine content type
            String contentType = "application/octet-stream";
            if (originalFileName != null) {
                String lowerName = originalFileName.toLowerCase();
                if (lowerName.endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (lowerName.endsWith(".png")) {
                    contentType = "image/png";
                }
            }
            headers.setContentType(MediaType.parseMediaType(contentType));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(data, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl,
                    HttpMethod.POST,
                    requestEntity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                // Construct public URL
                // Format:
                // https://<project_id>.supabase.co/storage/v1/object/public/<bucket>/<key>
                return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + fileName;
            } else {
                throw new RuntimeException("Upload failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to upload file to Supabase via REST: {}", e.getMessage());
            throw new RuntimeException("Storage upload failed: " + e.getMessage());
        }
    }

    public byte[] downloadFile(String fileUrl) {
        try {
            // If it's a public URL, we can just download it directly without auth headers
            // usually,
            // but if the bucket is private, we need headers.
            // For now, assuming public read access or using the same key.

            HttpHeaders headers = new HttpHeaders();
            // Only add auth if needed. Public URLs usually don't need it.
            // But if we are downloading via the API endpoint (not public URL), we need it.
            // The fileUrl stored is the Public URL.

            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    fileUrl,
                    HttpMethod.GET,
                    requestEntity,
                    byte[].class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Download failed with status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to download file from Supabase: {}", e.getMessage());
            throw new RuntimeException("Storage download failed: " + e.getMessage());
        }
    }
    public void deleteFile(String fileUrl) {
        try {
            // Extract file path from URL
            // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<folder>/<filename>
            // We need: <folder>/<filename>
            
            String bucketPath = "/public/" + bucketName + "/";
            int startIndex = fileUrl.indexOf(bucketPath);
            
            if (startIndex == -1) {
                log.warn("Invalid file URL format for deletion: {}", fileUrl);
                return;
            }
            
            String filePath = fileUrl.substring(startIndex + bucketPath.length());
            String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("apikey", apiKey);
            
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                    deleteUrl,
                    HttpMethod.DELETE,
                    requestEntity,
                    String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("File deleted from Supabase: {}", filePath);
            } else {
                log.error("Failed to delete file from Supabase. Status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error deleting file from Supabase: {}", e.getMessage());
            // Don't throw exception to avoid breaking the main transaction
        }
    }
}
